using UnityEngine;
using System.Collections.Generic;
using Sparkaph.Utils;

namespace Sparkaph.Effects
{
    public class ParticleManager : MonoBehaviour
    {
        public static ParticleManager Instance { get; private set; }

        [Header("Particle Prefabs")]
        [SerializeField] private GameObject deathExplosionPrefab;
        [SerializeField] private GameObject killEffectPrefab;
        [SerializeField] private GameObject territoryCaptureEffectPrefab;
        [SerializeField] private GameObject trailParticlePrefab;
        [SerializeField] private GameObject powerupEffectPrefab;

        [Header("Pool Settings")]
        [SerializeField] private int poolSize = 20;

        private Dictionary<string, ObjectPool> particlePools;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);

            InitializePools();
        }

        private void InitializePools()
        {
            particlePools = new Dictionary<string, ObjectPool>();

            if (deathExplosionPrefab != null)
                CreatePool("death", deathExplosionPrefab);

            if (killEffectPrefab != null)
                CreatePool("kill", killEffectPrefab);

            if (territoryCaptureEffectPrefab != null)
                CreatePool("capture", territoryCaptureEffectPrefab);

            if (trailParticlePrefab != null)
                CreatePool("trail", trailParticlePrefab);

            if (powerupEffectPrefab != null)
                CreatePool("powerup", powerupEffectPrefab);
        }

        private void CreatePool(string poolName, GameObject prefab)
        {
            GameObject poolContainer = new GameObject($"Pool_{poolName}");
            poolContainer.transform.SetParent(transform);

            ObjectPool pool = poolContainer.AddComponent<ObjectPool>();
            // Configure pool via reflection or public methods
            particlePools[poolName] = pool;
        }

        public void PlayDeathEffect(Vector3 position, Color playerColor)
        {
            PlayEffect("death", position, playerColor, 2f);
        }

        public void PlayKillEffect(Vector3 position, Color killerColor)
        {
            PlayEffect("kill", position, killerColor, 1.5f);
        }

        public void PlayTerritoryCaptureEffect(Vector3 position, Color territoryColor, float intensity)
        {
            GameObject effect = PlayEffect("capture", position, territoryColor, 1f);
            if (effect != null)
            {
                ParticleSystem ps = effect.GetComponent<ParticleSystem>();
                if (ps != null)
                {
                    var emission = ps.emission;
                    emission.rateOverTime = 50 * intensity;
                }
            }
        }

        public void PlayTrailEffect(Vector3 position, Color trailColor)
        {
            PlayEffect("trail", position, trailColor, 0.5f);
        }

        public void PlayPowerupEffect(Vector3 position)
        {
            PlayEffect("powerup", position, Color.white, 1f);
        }

        private GameObject PlayEffect(string effectName, Vector3 position, Color color, float duration)
        {
            if (!particlePools.ContainsKey(effectName))
            {
                Debug.LogWarning($"[ParticleManager] Pool '{effectName}' not found");
                return null;
            }

            GameObject effect = particlePools[effectName].Get();
            if (effect == null)
            {
                Debug.LogWarning($"[ParticleManager] Failed to get effect from pool '{effectName}'");
                return null;
            }

            effect.transform.position = position;

            // Set particle color
            ParticleSystem ps = effect.GetComponent<ParticleSystem>();
            if (ps != null)
            {
                var main = ps.main;
                main.startColor = color;
                ps.Play();
            }

            // Auto-return to pool after duration
            StartCoroutine(ReturnToPoolAfterDelay(effectName, effect, duration));

            return effect;
        }

        private System.Collections.IEnumerator ReturnToPoolAfterDelay(string poolName, GameObject effect, float delay)
        {
            yield return new WaitForSeconds(delay);

            if (effect != null && particlePools.ContainsKey(poolName))
            {
                particlePools[poolName].Return(effect);
            }
        }

        public void StopAllEffects()
        {
            foreach (var pool in particlePools.Values)
            {
                pool.ReturnAll();
            }
        }
    }
}
