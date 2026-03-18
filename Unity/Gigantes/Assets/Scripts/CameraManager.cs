using UnityEngine;
using System.Collections.Generic;

public class CameraManager : MonoBehaviour
{
    [System.Serializable]
    public struct CameraShot
    {
        public string name;
        public Vector3 position;
        public Vector3 target;
    }

    public List<CameraShot> shots = new List<CameraShot>() {
        new CameraShot { name = "Cinematic", position = new Vector3(0, 0, 45), target = Vector3.zero },
        new CameraShot { name = "SideScale", position = new Vector3(8, 0, 35), target = new Vector3(5, 0, 0) },
        new CameraShot { name = "Comparison", position = new Vector3(0, -0.5f, 40), target = Vector3.zero },
        new CameraShot { name = "Top", position = new Vector3(0, 40, 5), target = Vector3.zero },
        new CameraShot { name = "DinoFocus", position = new Vector3(5, 5, 30), target = new Vector3(5, 3, -8) },
        new CameraShot { name = "Free", position = new Vector3(0, 0, 40), target = Vector3.zero }
    };

    public float transitionSpeed = 2.0f;
    public string currentMode = "Cinematic";

    private CameraShot _targetShot;
    private bool _isFree = false;

    void Start()
    {
        SetMode("Cinematic");
    }

    public void SetMode(string modeName)
    {
        currentMode = modeName;
        CameraShot s = shots.Find(x => x.name == modeName);
        if (!string.IsNullOrEmpty(s.name))
        {
            _targetShot = s;
            _isFree = (modeName == "Free");
        }
    }

    void Update()
    {
        if (_isFree) return; // Implement free cam logic if needed

        transform.position = Vector3.Lerp(transform.position, _targetShot.position, Time.deltaTime * transitionSpeed);
        
        Quaternion targetRot = Quaternion.LookRotation(_targetShot.target - transform.position);
        transform.rotation = Quaternion.Slerp(transform.rotation, targetRot, Time.deltaTime * transitionSpeed);
    }

    void OnGUI()
    {
        // Simple UI to switch modes
        GUILayout.BeginArea(new Rect(10, 10, 150, 400));
        GUILayout.Label("Camera Modes");
        foreach (var s in shots)
        {
            if (GUILayout.Button(s.name))
            {
                SetMode(s.name);
            }
        }
        GUILayout.EndArea();
    }
}
