using System.Collections.Generic;
using UnityEngine;

namespace Sparkaph.Game
{
    public class TerritoryRenderer : MonoBehaviour
    {
        [Header("Grid Settings")]
        [SerializeField] private int gridSize = 1000;
        [SerializeField] private float cellSize = 0.1f;

        [Header("Visual")]
        [SerializeField] private Material territoryMaterial;
        [SerializeField] private float territoryAlpha = 0.3f;

        private Dictionary<string, TerritoryData> territories = new Dictionary<string, TerritoryData>();
        private GameObject territoryContainer;

        private class TerritoryData
        {
            public string PlayerId;
            public Color Color;
            public float Percentage;
            public GameObject VisualObject;
            public MeshFilter MeshFilter;
            public MeshRenderer MeshRenderer;
            public List<Vector2Int> Cells = new List<Vector2Int>();
        }

        public void Initialize(int size)
        {
            gridSize = size;

            territoryContainer = new GameObject("TerritoryContainer");
            territoryContainer.transform.SetParent(transform);

            if (territoryMaterial == null)
            {
                territoryMaterial = new Material(Shader.Find("Sprites/Default"));
            }
        }

        public void UpdatePlayerTerritory(string playerId, float percentage)
        {
            if (!territories.ContainsKey(playerId))
            {
                CreateTerritoryForPlayer(playerId);
            }

            var territory = territories[playerId];
            territory.Percentage = percentage;

            // In a full implementation, you would receive cell data from server
            // and update the mesh accordingly. For now, we'll create a simple visualization.
        }

        private void CreateTerritoryForPlayer(string playerId)
        {
            var territoryObj = new GameObject($"Territory_{playerId}");
            territoryObj.transform.SetParent(territoryContainer.transform);

            var meshFilter = territoryObj.AddComponent<MeshFilter>();
            var meshRenderer = territoryObj.AddComponent<MeshRenderer>();

            // Assign material
            var mat = new Material(territoryMaterial);
            mat.color = new Color(Random.value, Random.value, Random.value, territoryAlpha);
            meshRenderer.material = mat;
            meshRenderer.sortingOrder = -1; // Behind players

            var territory = new TerritoryData
            {
                PlayerId = playerId,
                Color = mat.color,
                VisualObject = territoryObj,
                MeshFilter = meshFilter,
                MeshRenderer = meshRenderer
            };

            territories[playerId] = territory;
        }

        public void UpdateTerritoryCells(string playerId, List<Vector2Int> cells, Color color)
        {
            if (!territories.ContainsKey(playerId))
            {
                CreateTerritoryForPlayer(playerId);
            }

            var territory = territories[playerId];
            territory.Cells = cells;
            territory.Color = color;

            // Update mesh
            GenerateTerritoryMesh(territory);
        }

        private void GenerateTerritoryMesh(TerritoryData territory)
        {
            if (territory.Cells.Count == 0)
            {
                territory.MeshFilter.mesh = null;
                return;
            }

            List<Vector3> vertices = new List<Vector3>();
            List<int> triangles = new List<int>();
            List<Color> colors = new List<Color>();

            // Generate mesh from cells
            // This is a simplified version - in production you'd use marching squares
            // or similar algorithm for smooth territory edges

            foreach (var cell in territory.Cells)
            {
                float x = cell.x * cellSize;
                float y = cell.y * cellSize;

                int vertexIndex = vertices.Count;

                // Create quad for cell
                vertices.Add(new Vector3(x, y, 0));
                vertices.Add(new Vector3(x + cellSize, y, 0));
                vertices.Add(new Vector3(x + cellSize, y + cellSize, 0));
                vertices.Add(new Vector3(x, y + cellSize, 0));

                // Add colors
                for (int i = 0; i < 4; i++)
                {
                    colors.Add(territory.Color);
                }

                // Create triangles
                triangles.Add(vertexIndex);
                triangles.Add(vertexIndex + 1);
                triangles.Add(vertexIndex + 2);

                triangles.Add(vertexIndex);
                triangles.Add(vertexIndex + 2);
                triangles.Add(vertexIndex + 3);
            }

            Mesh mesh = new Mesh();
            mesh.vertices = vertices.ToArray();
            mesh.triangles = triangles.ToArray();
            mesh.colors = colors.ToArray();
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();

            territory.MeshFilter.mesh = mesh;
        }

        public void ClearTerritory(string playerId)
        {
            if (territories.TryGetValue(playerId, out TerritoryData territory))
            {
                if (territory.VisualObject != null)
                {
                    Destroy(territory.VisualObject);
                }
                territories.Remove(playerId);
            }
        }

        public void ClearAllTerritories()
        {
            foreach (var territory in territories.Values)
            {
                if (territory.VisualObject != null)
                {
                    Destroy(territory.VisualObject);
                }
            }
            territories.Clear();
        }

        public float GetTerritoryPercentage(string playerId)
        {
            if (territories.TryGetValue(playerId, out TerritoryData territory))
            {
                return territory.Percentage;
            }
            return 0f;
        }
    }
}
