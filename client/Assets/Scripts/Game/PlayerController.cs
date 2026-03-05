using UnityEngine;
using Sparkaph.Network;

namespace Sparkaph.Game
{
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement")]
        [SerializeField] private float moveSpeed = 5f;
        [SerializeField] private float smoothTime = 0.1f;

        [Header("Visual")]
        [SerializeField] private SpriteRenderer spriteRenderer;
        [SerializeField] private Color playerColor = Color.blue;
        [SerializeField] private TrailRenderer trailRenderer;

        private Vector2 moveDirection;
        private Vector2 currentVelocity;
        private Vector2 targetPosition;
        private bool isLocalPlayer;
        private string playerId;

        // Input
        private Vector2 touchStartPos;
        private bool isTouching;

        public string PlayerId => playerId;
        public bool IsLocalPlayer => isLocalPlayer;
        public Vector2 Position => transform.position;

        private void Start()
        {
            if (spriteRenderer != null)
            {
                spriteRenderer.color = playerColor;
            }

            if (trailRenderer != null)
            {
                trailRenderer.startColor = playerColor;
                trailRenderer.endColor = new Color(playerColor.r, playerColor.g, playerColor.b, 0f);
            }
        }

        private void Update()
        {
            if (isLocalPlayer)
            {
                HandleInput();
                SendInputToServer();
            }

            Move();
        }

        public void Initialize(string id, bool isLocal, Color color)
        {
            playerId = id;
            isLocalPlayer = isLocal;
            playerColor = color;

            if (spriteRenderer != null)
            {
                spriteRenderer.color = playerColor;
            }

            if (trailRenderer != null)
            {
                trailRenderer.startColor = playerColor;
                trailRenderer.endColor = new Color(playerColor.r, playerColor.g, playerColor.b, 0f);
                trailRenderer.enabled = true;
            }
        }

        private void HandleInput()
        {
            // Keyboard input (for testing in editor)
            if (Application.isEditor)
            {
                float horizontal = Input.GetAxisRaw("Horizontal");
                float vertical = Input.GetAxisRaw("Vertical");

                if (horizontal != 0 || vertical != 0)
                {
                    moveDirection = new Vector2(horizontal, vertical).normalized;
                }
            }

            // Touch/Mouse input (for mobile)
            if (Input.GetMouseButtonDown(0))
            {
                touchStartPos = Input.mousePosition;
                isTouching = true;
            }
            else if (Input.GetMouseButton(0) && isTouching)
            {
                Vector2 currentTouchPos = Input.mousePosition;
                Vector2 swipeDelta = currentTouchPos - touchStartPos;

                if (swipeDelta.magnitude > 10f)
                {
                    moveDirection = swipeDelta.normalized;
                }
            }
            else if (Input.GetMouseButtonUp(0))
            {
                isTouching = false;
            }

            // Joystick input (if using virtual joystick)
            // Can be integrated with mobile joystick asset
        }

        private void SendInputToServer()
        {
            if (NetworkManager.Instance != null && NetworkManager.Instance.IsConnected)
            {
                NetworkManager.Instance.SendInputMessage(moveDirection);
            }
        }

        private void Move()
        {
            if (moveDirection.magnitude > 0.1f)
            {
                Vector2 targetVelocity = moveDirection * moveSpeed;
                Vector2 smoothVelocity = Vector2.SmoothDamp(
                    (Vector2)transform.position,
                    (Vector2)transform.position + targetVelocity * Time.deltaTime,
                    ref currentVelocity,
                    smoothTime
                );

                transform.position = smoothVelocity;
            }
        }

        public void UpdateFromServer(PlayerState state)
        {
            if (isLocalPlayer)
            {
                // For local player, we use client-side prediction
                // Only correct if there's significant drift
                float drift = Vector2.Distance(transform.position, state.Position.ToVector2());
                if (drift > 2f)
                {
                    transform.position = state.Position.ToVector2();
                }
            }
            else
            {
                // For remote players, interpolate to server position
                targetPosition = state.Position.ToVector2();
                transform.position = Vector2.Lerp(transform.position, targetPosition, Time.deltaTime * 10f);
            }

            // Update trail
            if (trailRenderer != null && state.Trail != null && state.Trail.Count > 0)
            {
                // Trail is handled by TrailRenderer component automatically
                // But we can update it if needed for more control
            }
        }

        public void SetColor(Color color)
        {
            playerColor = color;
            if (spriteRenderer != null)
            {
                spriteRenderer.color = color;
            }
            if (trailRenderer != null)
            {
                trailRenderer.startColor = color;
                trailRenderer.endColor = new Color(color.r, color.g, color.b, 0f);
            }
        }

        public void OnDeath()
        {
            if (trailRenderer != null)
            {
                trailRenderer.Clear();
            }

            // Play death animation/effect
            // For now, just hide
            if (spriteRenderer != null)
            {
                spriteRenderer.enabled = false;
            }
        }

        public void OnRespawn(Vector2 position)
        {
            transform.position = position;

            if (spriteRenderer != null)
            {
                spriteRenderer.enabled = true;
            }

            if (trailRenderer != null)
            {
                trailRenderer.Clear();
                trailRenderer.enabled = true;
            }
        }
    }
}
