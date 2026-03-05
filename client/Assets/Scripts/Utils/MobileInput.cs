using UnityEngine;
using UnityEngine.EventSystems;

namespace Sparkaph.Utils
{
    public class MobileInput : MonoBehaviour, IPointerDownHandler, IDragHandler, IPointerUpHandler
    {
        [Header("Joystick Settings")]
        [SerializeField] private RectTransform joystickBackground;
        [SerializeField] private RectTransform joystickHandle;
        [SerializeField] private float joystickRadius = 50f;
        [SerializeField] private bool dynamicJoystick = true;

        private Vector2 joystickCenter;
        private Vector2 inputDirection;
        private bool isDragging;

        public Vector2 Direction => inputDirection;
        public bool IsActive => isDragging;

        private void Start()
        {
            if (joystickBackground != null)
            {
                joystickCenter = joystickBackground.anchoredPosition;
                
                if (!dynamicJoystick)
                {
                    joystickBackground.gameObject.SetActive(true);
                }
                else
                {
                    joystickBackground.gameObject.SetActive(false);
                }
            }
        }

        public void OnPointerDown(PointerEventData eventData)
        {
            if (joystickBackground == null) return;

            isDragging = true;

            if (dynamicJoystick)
            {
                joystickBackground.gameObject.SetActive(true);
                RectTransformUtility.ScreenPointToLocalPointInRectangle(
                    transform as RectTransform,
                    eventData.position,
                    eventData.pressEventCamera,
                    out joystickCenter
                );
                joystickBackground.anchoredPosition = joystickCenter;
            }

            OnDrag(eventData);
        }

        public void OnDrag(PointerEventData eventData)
        {
            if (joystickBackground == null || joystickHandle == null) return;

            Vector2 localPoint;
            RectTransformUtility.ScreenPointToLocalPointInRectangle(
                joystickBackground,
                eventData.position,
                eventData.pressEventCamera,
                out localPoint
            );

            Vector2 offset = localPoint;
            inputDirection = offset.normalized;

            // Clamp handle position
            if (offset.magnitude > joystickRadius)
            {
                offset = offset.normalized * joystickRadius;
            }

            joystickHandle.anchoredPosition = offset;
        }

        public void OnPointerUp(PointerEventData eventData)
        {
            isDragging = false;
            inputDirection = Vector2.zero;

            if (joystickHandle != null)
            {
                joystickHandle.anchoredPosition = Vector2.zero;
            }

            if (dynamicJoystick && joystickBackground != null)
            {
                joystickBackground.gameObject.SetActive(false);
            }
        }

        private void Update()
        {
            // Fallback to keyboard for testing
            if (!isDragging && Application.isEditor)
            {
                float horizontal = Input.GetAxisRaw("Horizontal");
                float vertical = Input.GetAxisRaw("Vertical");

                if (horizontal != 0 || vertical != 0)
                {
                    inputDirection = new Vector2(horizontal, vertical).normalized;
                }
                else
                {
                    inputDirection = Vector2.zero;
                }
            }
        }
    }
}
