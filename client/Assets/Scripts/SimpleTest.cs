using UnityEngine;
using NativeWebSocket;
using System.Text;

public class SimpleTest : MonoBehaviour
{
    private WebSocket websocket;
    
    async void Start()
    {
        Debug.Log("=== SPARKAPH TEST START ===");
        Debug.Log("Connecting to ws://localhost:8081/ws");
        
        websocket = new WebSocket("ws://localhost:8081/ws");

        websocket.OnOpen += () =>
        {
            Debug.Log("✅ CONNECTION SUCCESSFUL!");
            Debug.Log("Server is running and accepting connections");
        };

        websocket.OnError += (e) =>
        {
            Debug.LogError("❌ CONNECTION ERROR: " + e);
            Debug.LogError("Make sure server is running on port 8081");
        };

        websocket.OnClose += (e) =>
        {
            Debug.Log("Connection closed: " + e);
        };

        websocket.OnMessage += (bytes) =>
        {
            var message = Encoding.UTF8.GetString(bytes);
            Debug.Log("Received: " + message);
        };

        await websocket.Connect();
    }

    void Update()
    {
        #if !UNITY_WEBGL || UNITY_EDITOR
        if (websocket != null)
        {
            websocket.DispatchMessageQueue();
        }
        #endif
    }

    async void OnDestroy()
    {
        if (websocket != null)
        {
            await websocket.Close();
        }
    }
}
