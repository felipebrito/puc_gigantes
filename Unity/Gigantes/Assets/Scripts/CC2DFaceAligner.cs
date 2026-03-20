using UnityEngine;
using System.Collections.Generic;

public class CC2DFaceAligner : MonoBehaviour
{
    [Header("Face Parts to Hide")]
    public string[] partsToHide = new string[] { "Eyebrow", "Eyes", "Nose", "Mouth" };
    
    [Header("Target Bone")]
    public string headBoneName = "Head"; // Or "Bone_Head"
    public float faceScale = 4.74f; 
    public Vector3 faceOffset = new Vector3(-0.15f, -0.38f, -0.2f);
    public Vector3 faceRotation = Vector3.zero;

    private Transform _headBone;
    private GameObject _currentFaceObj;

    public void SetFace(Texture2D photo)
    {
        if (!photo) 
        {
            Debug.LogError("[CC2DFaceAligner] Photo texture is null!");
            return;
        }

        Debug.Log($"[CC2DFaceAligner] Attempting to set face with texture: {photo.name}");
        StartCoroutine(ApplyFaceRoutine(photo));
    }

    System.Collections.IEnumerator ApplyFaceRoutine(Texture2D photo)
    {
        // Wait longer to ensure everything is initialized
        // Wait briefly (frame) to ensure everything is initialized
        yield return null;
        
        // 1. Find Head Bone if not found
        if (!_headBone)
        {
            _headBone = FindDeepChild(transform, headBoneName);
            if (!_headBone) _headBone = FindDeepChild(transform, "Bone_Head");
            if (!_headBone) _headBone = FindDeepChild(transform, "Head");
        }

        if (!_headBone)
        {
            Debug.LogError($"[CC2DFaceAligner] Could not find Head bone: {headBoneName} or Bone_Head in {name}");
            yield break;
        }

        Debug.Log($"[CC2DFaceAligner] Found Head Bone: {_headBone.name} | Parent: {_headBone.parent?.name} | Path: {GetPath(_headBone)}");

        // 2. Hide facial features
        int hiddenCount = 0;
        foreach (string partName in partsToHide)
        {
            // Search for parts containing the name
            List<Transform> found = FindDeepChildrenPartial(transform, partName);
            foreach (var t in found)
            {
                t.gameObject.SetActive(false);
                hiddenCount++;
                Debug.Log($"[CC2DFaceAligner] Hiding: {t.name} (Parent: {t.parent.name})");
            }
        }
        Debug.Log($"[CC2DFaceAligner] Hidden {hiddenCount} facial parts.");

        // 3. Create/Update Face Quad
        if (_currentFaceObj) Destroy(_currentFaceObj);

        _currentFaceObj = GameObject.CreatePrimitive(PrimitiveType.Quad);
        _currentFaceObj.name = "PhotoFace";
        _currentFaceObj.transform.SetParent(_headBone, false);
        _currentFaceObj.transform.localPosition = faceOffset;
        _currentFaceObj.transform.localRotation = Quaternion.identity; // Try default first, maybe Quaternion.Euler(0, 180, 0) if backward?
        _currentFaceObj.transform.localScale = Vector3.one * faceScale;

        // Remove collider
        Destroy(_currentFaceObj.GetComponent<Collider>());

        // Material
        Renderer r = _currentFaceObj.GetComponent<Renderer>();
        r.sortingOrder = 100; // Force on top of everything
        
        // Use Sprites/Default which is always included in builds to avoid Pink Shader issue
        Shader shader = Shader.Find("Sprites/Default");
        if (!shader) shader = Shader.Find("Mobile/Particles/Alpha Blended"); // Fallback

        Material mat = new Material(shader);
        mat.mainTexture = photo;
        
        r.material = mat;
        
        // Debug Cube to verify position
        /*
        GameObject debugCube = GameObject.CreatePrimitive(PrimitiveType.Cube);
        debugCube.transform.SetParent(_currentFaceObj.transform, false);
        debugCube.transform.localScale = Vector3.one * 0.1f;
        debugCube.transform.localPosition = new Vector3(0, 0, 0.1f); 
        debugCube.GetComponent<Renderer>().material.color = Color.red;
        */
        
        Debug.Log("[CC2DFaceAligner] Face applying complete. Check for Red Cube behind face.");
    }

    void Update()
    {
        // Allow runtime adjustment
        if (_currentFaceObj)
        {
            _currentFaceObj.transform.localPosition = faceOffset;
            _currentFaceObj.transform.localScale = Vector3.one * faceScale;
            _currentFaceObj.transform.localEulerAngles = faceRotation;
        }
    }

    Transform FindDeepChild(Transform parent, string name)
    {
        foreach (Transform child in parent)
        {
            if (child.name == name) return child;
            Transform result = FindDeepChild(child, name);
            if (result != null) return result;
        }
        return null;
    }

    List<Transform> FindDeepChildrenPartial(Transform parent, string namePart)
    {
        List<Transform> results = new List<Transform>();
        FindDeepChildrenPartialRecursive(parent, namePart, results);
        return results;
    }

    void FindDeepChildrenPartialRecursive(Transform parent, string namePart, List<Transform> results)
    {
        foreach (Transform child in parent)
        {
            if (child.name.Contains(namePart)) results.Add(child);
            FindDeepChildrenPartialRecursive(child, namePart, results);
        }
    }
    
    string GetPath(Transform t)
    {
        if (t.parent == null) return t.name;
        return GetPath(t.parent) + "/" + t.name;
    }
}
