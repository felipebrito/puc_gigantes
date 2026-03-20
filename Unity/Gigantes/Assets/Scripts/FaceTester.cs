using UnityEngine;

public class FaceTester : MonoBehaviour
{
    public GameObject characterPrefab;
    public Texture2D[] faces;
    public float spacing = 5.0f; // Increased spacing
    
    // Global settings to control all instances
    [Header("Global Settings")]
    public float faceScale = 3.5f;
    public Vector3 faceOffset = new Vector3(0, 0, -0.2f);
    public Vector3 faceRotation = Vector3.zero; // New rotation control

    void Start()
    {
        if (!characterPrefab) 
        {
            Debug.LogError("Character Prefab not assigned!");
            return;
        }

        // Auto-load if empty
        if (faces == null || faces.Length == 0)
        {
            string uploadsPath = "/Users/brito/Desktop/PUC/server/public/uploads";
            if (System.IO.Directory.Exists(uploadsPath))
            {
                var files = System.IO.Directory.GetFiles(uploadsPath, "*.png"); // simplified extension check
                // also get jpg?
                // string[] files = System.IO.Directory.GetFiles(uploadsPath, "*.*").Where(s => s.EndsWith(".png") || s.EndsWith(".jpg")).ToArray();
                
                var loadedFaces = new System.Collections.Generic.List<Texture2D>();
                
                foreach (var file in files)
                {
                    if (file.Contains("visiting")) continue; // Skip misc files if needed
                    
                    byte[] bytes = System.IO.File.ReadAllBytes(file);
                    Texture2D tex = new Texture2D(2, 2);
                    if (tex.LoadImage(bytes))
                    {
                        tex.name = System.IO.Path.GetFileName(file);
                        loadedFaces.Add(tex);
                    }
                }
                
                faces = loadedFaces.ToArray();
                Debug.Log($"[FaceTester] Loaded {faces.Length} faces from {uploadsPath}");
            }
            else
            {
                 Debug.LogError($"[FaceTester] Path not found: {uploadsPath}");
            }
        }

        // Spawn loop
        for (int i = 0; i < faces.Length; i++)
        {
            if (i >= 5) break; 
            
            GameObject go = Instantiate(characterPrefab);
            go.transform.position = new Vector3(i * spacing, 0, 0);
            
            // Disable VisitorController movement if present
            var vc = go.GetComponent<VisitorController>();
            if (vc) vc.enabled = false;
            
            // Setup FaceAligner
            var aligner = go.GetComponent<CC2DFaceAligner>();
            if (!aligner) aligner = go.AddComponent<CC2DFaceAligner>();
            
            // Set initial values
            aligner.faceScale = faceScale;
            aligner.faceOffset = faceOffset;
            
            aligner.SetFace(faces[i]);
        }
    }
    
    void Update()
    {
        // Propagate changes to all children with CC2DFaceAligner
        CC2DFaceAligner[] aligners = FindObjectsByType<CC2DFaceAligner>(FindObjectsSortMode.None);
        foreach (var aligner in aligners)
        {
            aligner.faceScale = faceScale;
            aligner.faceOffset = faceOffset;
            aligner.faceRotation = faceRotation;
        }
    }
}
