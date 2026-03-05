terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }

  backend "gcs" {
    bucket = "sparkaph-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# GKE Cluster
resource "google_container_cluster" "sparkaph" {
  name     = "sparkaph-cluster"
  location = var.region

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }

  addons_config {
    http_load_balancing {
      disabled = false
    }
    horizontal_pod_autoscaling {
      disabled = false
    }
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }
}

# Node Pool
resource "google_container_node_pool" "primary_nodes" {
  name       = "sparkaph-node-pool"
  location   = var.region
  cluster    = google_container_cluster.sparkaph.name
  node_count = var.min_node_count

  autoscaling {
    min_node_count = var.min_node_count
    max_node_count = var.max_node_count
  }

  node_config {
    preemptible  = var.use_preemptible
    machine_type = var.machine_type

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      env = var.environment
      app = "sparkaph"
    }

    tags = ["sparkaph", var.environment]
  }
}

# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "sparkaph-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "sparkaph-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.name
}

# Cloud SQL (PostgreSQL)
resource "google_sql_database_instance" "postgres" {
  name             = "sparkaph-postgres"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = var.db_tier

    backup_configuration {
      enabled    = true
      start_time = "03:00"
    }

    ip_configuration {
      ipv4_enabled    = true
      private_network = google_compute_network.vpc.id
    }

    database_flags {
      name  = "max_connections"
      value = "200"
    }
  }

  deletion_protection = var.environment == "production"
}

resource "google_sql_database" "database" {
  name     = "sparkaph"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "user" {
  name     = "sparkaph"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}

# Redis (Memorystore)
resource "google_redis_instance" "cache" {
  name           = "sparkaph-redis"
  tier           = var.redis_tier
  memory_size_gb = var.redis_memory_gb
  region         = var.region

  authorized_network = google_compute_network.vpc.id

  redis_version = "REDIS_7_0"
}

# Cloud Storage for backups
resource "google_storage_bucket" "backups" {
  name          = "${var.project_id}-sparkaph-backups"
  location      = var.region
  force_destroy = false

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }

  versioning {
    enabled = true
  }
}

# Load Balancer
resource "google_compute_global_address" "default" {
  name = "sparkaph-lb-ip"
}

# Outputs
output "cluster_endpoint" {
  value     = google_container_cluster.sparkaph.endpoint
  sensitive = true
}

output "cluster_ca_certificate" {
  value     = google_container_cluster.sparkaph.master_auth[0].cluster_ca_certificate
  sensitive = true
}

output "postgres_connection" {
  value     = google_sql_database_instance.postgres.connection_name
  sensitive = true
}

output "redis_host" {
  value = google_redis_instance.cache.host
}

output "load_balancer_ip" {
  value = google_compute_global_address.default.address
}
