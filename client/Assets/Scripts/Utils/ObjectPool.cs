using System.Collections.Generic;
using UnityEngine;

namespace Sparkaph.Utils
{
    public class ObjectPool : MonoBehaviour
    {
        [SerializeField] private GameObject prefab;
        [SerializeField] private int initialSize = 10;
        [SerializeField] private int maxSize = 100;
        [SerializeField] private bool expandable = true;

        private Queue<GameObject> pool = new Queue<GameObject>();
        private List<GameObject> activeObjects = new List<GameObject>();
        private Transform poolContainer;

        private void Awake()
        {
            poolContainer = new GameObject($"Pool_{prefab.name}").transform;
            poolContainer.SetParent(transform);

            // Pre-instantiate objects
            for (int i = 0; i < initialSize; i++)
            {
                CreateNewObject();
            }
        }

        private GameObject CreateNewObject()
        {
            GameObject obj = Instantiate(prefab, poolContainer);
            obj.SetActive(false);
            pool.Enqueue(obj);
            return obj;
        }

        public GameObject Get()
        {
            GameObject obj;

            if (pool.Count > 0)
            {
                obj = pool.Dequeue();
            }
            else if (expandable && activeObjects.Count < maxSize)
            {
                obj = CreateNewObject();
            }
            else
            {
                Debug.LogWarning($"[ObjectPool] Pool exhausted for {prefab.name}");
                return null;
            }

            obj.SetActive(true);
            activeObjects.Add(obj);
            return obj;
        }

        public void Return(GameObject obj)
        {
            if (obj == null) return;

            obj.SetActive(false);
            obj.transform.SetParent(poolContainer);
            obj.transform.localPosition = Vector3.zero;
            obj.transform.localRotation = Quaternion.identity;

            activeObjects.Remove(obj);
            pool.Enqueue(obj);
        }

        public void ReturnAll()
        {
            for (int i = activeObjects.Count - 1; i >= 0; i--)
            {
                Return(activeObjects[i]);
            }
        }

        public int GetActiveCount()
        {
            return activeObjects.Count;
        }

        public int GetPooledCount()
        {
            return pool.Count;
        }
    }
}
