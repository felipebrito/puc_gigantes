using UnityEngine;

public class ProceduralAnimator : MonoBehaviour
{
    [Header("Joints")]
    public Transform hips;
    public Transform head;
    public Transform legL;
    public Transform legR;
    public Transform armL;
    public Transform armR;

    [Header("Settings")]
    public float speed = 5f;
    public float stride = 0.4f;
    public float bounce = 0.08f;
    public float scale = 1.0f;
    public string walkStyle = "normal";

    private Vector3 _initialHipsPos;
    private Vector3 _initialHeadPos;
    private Vector3 _initialLegLPos;
    private Vector3 _initialLegRPos;
    private Vector3 _initialArmLPos;
    private Vector3 _initialArmRPos;

    void Start()
    {
        if (hips) _initialHipsPos = hips.localPosition;
        if (head) _initialHeadPos = head.localPosition;
        if (legL) _initialLegLPos = legL.localPosition;
        if (legR) _initialLegRPos = legR.localPosition;
        if (armL) _initialArmLPos = armL.localPosition;
        if (armR) _initialArmRPos = armR.localPosition;
    }

    void Update()
    {
        float t = Time.time;
        float freq = speed * 1.5f; // Slightly faster frequency for natural feel
        float b = bounce;
        float s = stride;

        if (walkStyle == "fast") { freq *= 1.2f; b *= 1.3f; s *= 1.2f; }
        if (walkStyle == "long") { freq *= 0.8f; s *= 1.5f; }

        float cycle = t * freq;

        // 1. Hips (Pelvic bounce and tilt)
        if (hips)
        {
            float yOffset = Mathf.Abs(Mathf.Sin(cycle * 2f)) * b;
            hips.localPosition = new Vector3(_initialHipsPos.x, _initialHipsPos.y + yOffset, _initialHipsPos.z);
            
            float rotX = 0.1f + Mathf.Sin(cycle * 2f) * 0.02f; // Lean
            float rotY = Mathf.Sin(cycle) * 0.1f;            // Twist
            float rotZ = Mathf.Cos(cycle) * 0.02f;           // Sway
            
            // Convert to Euler angles (in degrees)
            hips.localRotation = Quaternion.Euler(rotX * Mathf.Rad2Deg, rotY * Mathf.Rad2Deg, rotZ * Mathf.Rad2Deg);
        }

        // 2. Legs
        if (legL)
        {
            float rotX = Mathf.Sin(cycle) * s;
            legL.localRotation = Quaternion.Euler(rotX * Mathf.Rad2Deg, 0, 0);
            
            // Knee bend simulation
            float yOff = Mathf.Max(0, Mathf.Cos(cycle)) * 0.05f;
            legL.localPosition = new Vector3(_initialLegLPos.x, _initialLegLPos.y + yOff, _initialLegLPos.z);
        }
        
        if (legR)
        {
            float rotX = Mathf.Sin(cycle + Mathf.PI) * s;
            legR.localRotation = Quaternion.Euler(rotX * Mathf.Rad2Deg, 0, 0);
            
            float yOff = Mathf.Max(0, Mathf.Cos(cycle + Mathf.PI)) * 0.05f;
            legR.localPosition = new Vector3(_initialLegRPos.x, _initialLegRPos.y + yOff, _initialLegRPos.z);
        }

        // 3. Arms
        if (armL)
        {
            float rotX = Mathf.Sin(cycle + Mathf.PI) * (s * 0.8f);
            float rotZ = -0.1f + Mathf.Sin(cycle * 2f) * 0.02f;
            armL.localRotation = Quaternion.Euler(rotX * Mathf.Rad2Deg, 0, rotZ * Mathf.Rad2Deg);
        }
        
        if (armR)
        {
            float rotX = Mathf.Sin(cycle) * (s * 0.8f);
            float rotZ = 0.1f - Mathf.Sin(cycle * 2f) * 0.02f;
            armR.localRotation = Quaternion.Euler(rotX * Mathf.Rad2Deg, 0, rotZ * Mathf.Rad2Deg);
        }

        // 4. Head
        if (head)
        {
            float rotY = -Mathf.Sin(cycle) * 0.05f;
            head.localRotation = Quaternion.Euler(0, rotY * Mathf.Rad2Deg, 0);
            
            float yOff = Mathf.Sin(cycle * 2f + 0.5f) * 0.02f;
            head.localPosition = new Vector3(_initialHeadPos.x, _initialHeadPos.y + yOff, _initialHeadPos.z);
        }
    }
}
