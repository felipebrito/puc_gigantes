using UnityEngine;
using System.Collections.Generic;
using System.Linq;

public class VisitorSpawner : MonoBehaviour
{
    [Header("Spawning")]
    public float interval = 2.0f;
    public int maxVisitors = 15;
    
    public int ActiveCount => _activeVisitors.Count;
    
    [Header("Spawning Area")]
    public Transform[] areaMarkers; // Drag 4 objects here to define the rectangle

    [Header("Randomization")]
    public float minSpeed = 1.0f;
    public float maxSpeed = 2.5f;
    public float minScale = 1.05f;
    public float maxScale = 1.25f;

    [Header("Resources")]
    public string texturesPath = "Textures";
    
    private float _timer;
    private List<VisitorController> _activeVisitors = new List<VisitorController>();
    private List<Texture> _availableFaces = new List<Texture>();
    private Texture[] _availableClothing;

    void Start()
    {
        // Load all textures but filter out known clothing/patterns
        string[] excluded = new string[] { "suit", "dress", "casual", "fur", "leather", "leopard" };
        
        Texture[] allTextures = Resources.LoadAll<Texture>(texturesPath);
        foreach (var t in allTextures)
        {
            // Simple check: if name contains any excluded keyword, skip
            bool isExcluded = false;
            foreach (var ex in excluded)
            {
                if (t.name.ToLower().Contains(ex))
                {
                    isExcluded = true;
                    break;
                }
            }
            
            if (!isExcluded)
            {
                _availableFaces.Add(t);
            }
        }
        
        _availableClothing = new Texture[] {
            Resources.Load<Texture>("Textures/suit"),
            Resources.Load<Texture>("Textures/dress"),
            Resources.Load<Texture>("Textures/casual")
        };
        
        _availableClothing = _availableClothing.Where(t => t != null).ToArray();
    }

    public void AddFace(Texture face)
    {
        if (face && !_availableFaces.Contains(face))
        {
            _availableFaces.Add(face);
        }
    }

    public void RemoveFace(string faceName)
    {
        var faceToRemove = _availableFaces.Find(f => f.name == faceName);
        if (faceToRemove)
        {
            _availableFaces.Remove(faceToRemove);
            // Optional: Destroy(faceToRemove) if we are sure no active visitor is using it
            // For now, let GC handle it or keep it until scene reload
        }
    }

    void Update()
    {
        _timer += Time.deltaTime;
        if (_timer > interval && _activeVisitors.Count < maxVisitors)
        {
            _timer = 0;
            if (Random.value < 0.5f)
            {
                SpawnVisitor();
            }
        }
    }

    [Header("CC2D Integration")]
    public GameObject visitorPrefab; // Drag 01.prefab here

    void SpawnVisitor()
    {
        if (_availableFaces.Count == 0) 
        {
            Debug.LogWarning("[VisitorSpawner] No faces available to spawn visitors! Check Resources/Textures.");
            return;
        }
        if (areaMarkers == null || areaMarkers.Length == 0) 
        {
            Debug.LogWarning("[VisitorSpawner] No Area Markers assigned! Please assign 4 transforms in the Inspector.");
            return;
        }

        // Calculate Bounds from Markers
        float minX = float.MaxValue, maxX = float.MinValue;
        float minZ = float.MaxValue, maxZ = float.MinValue;

        foreach (var t in areaMarkers)
        {
            if (t)
            {
                if (t.position.x < minX) minX = t.position.x;
                if (t.position.x > maxX) maxX = t.position.x;
                if (t.position.z < minZ) minZ = t.position.z;
                if (t.position.z > maxZ) maxZ = t.position.z;
            }
        }

        // Logic from React:
        // direction, speed, z, scale, walkStyle, clothing
        float direction = Random.value > 0.5f ? 1 : -1;
        float speed = Random.Range(minSpeed, maxSpeed);
        
        // Spawn at one end, move to other
        float startX = (direction > 0) ? minX : maxX;
        float endX = (direction > 0) ? maxX : minX;
        
        float z = Random.Range(minZ, maxZ);
        float scale = Random.Range(0.25f, 0.35f); // Reduced scale closer to match scene
        
        Texture face = _availableFaces[Random.Range(0, _availableFaces.Count)];
        
        // Use Prefab if available
        GameObject go;
        if (visitorPrefab)
        {
            go = Instantiate(visitorPrefab);
            go.SetActive(true);
            
            if (!go.GetComponent<CharacterCreator2D.CharacterViewer>())
            {
                Debug.LogWarning("[VisitorSpawner] The instantiated CC2D prefab is missing the 'CharacterViewer' component. Please export it correctly with the component attached.");
            }
        }
        else
        {
             // Fallback
             Texture cloth = _availableClothing.Length > 0 ? _availableClothing[Random.Range(0, _availableClothing.Length)] : null;
             go = VisitorBuilder.CreateVisitor(face, cloth);
        }

        go.transform.position = new Vector3(startX, -3, z);
        
        // Add or Get VisitorController
        VisitorController vc = go.GetComponent<VisitorController>();
        if (!vc) vc = go.AddComponent<VisitorController>();
        
        // If CC2D, attach FaceAligner if missing
        if (visitorPrefab)
        {
            CC2DFaceAligner aligner = go.GetComponent<CC2DFaceAligner>();
            if (!aligner) aligner = go.AddComponent<CC2DFaceAligner>();
            // Apply Face
            if (face) aligner.SetFace((Texture2D)face);
        }

        vc.boundary = endX;
        // For CC2D, we might ignore clothing texture in Initialize or handle it differently
        vc.Initialize(speed, direction, face, null, "normal", scale, OnVisitorDestroyed);
        
        _activeVisitors.Add(vc);
    }

    void OnVisitorDestroyed(VisitorController vc)
    {
        if (_activeVisitors.Contains(vc))
            _activeVisitors.Remove(vc);
    }
}
