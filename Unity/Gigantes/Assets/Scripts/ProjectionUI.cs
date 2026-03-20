using UnityEngine;

public class ProjectionUI : MonoBehaviour
{
    // React: <Billboard> <Text>GIGANTES DE PORTO ALEGRE</Text> ...
    // In Unity, we can use a World Space Canvas or just OnGUI for now.
    // Given the instruction "Refine later", OnGUI is fastest to prove functionality.
    // However, the user wants "Port functionalities... display, Sortear".
    // A 3D Text Mesh in the scene is better for "Billboard" effect than Screen Space UI.
    
    public Font font;
    private VisitorSpawner _spawner;
    private TextMesh _titleMesh;
    private TextMesh _statusMesh;

    void Start()
    {
        _spawner = FindFirstObjectByType<VisitorSpawner>();
        CreateWorldUI();
    }

    void CreateWorldUI()
    {
        GameObject root = new GameObject("WorldUI");
        root.transform.position = new Vector3(0, 2.5f, -15);
        
        // Title
        GameObject titleObj = new GameObject("Title");
        titleObj.transform.parent = root.transform;
        titleObj.transform.localPosition = Vector3.zero;
        _titleMesh = titleObj.AddComponent<TextMesh>();
        _titleMesh.text = "GIGANTES DE PORTO ALEGRE";
        _titleMesh.fontSize = 50;
        _titleMesh.characterSize = 0.1f; // High quality
        _titleMesh.anchor = TextAnchor.MiddleCenter;
        _titleMesh.alignment = TextAlignment.Center;
        _titleMesh.color = Color.white;
        if(font) _titleMesh.font = font;

        // Status
        GameObject statusObj = new GameObject("Status");
        statusObj.transform.parent = root.transform;
        statusObj.transform.localPosition = new Vector3(0, -1.0f, 0);
        _statusMesh = statusObj.AddComponent<TextMesh>();
        _statusMesh.text = "Initializing...";
        _statusMesh.fontSize = 25;
        _statusMesh.characterSize = 0.1f;
        _statusMesh.anchor = TextAnchor.MiddleCenter;
        _statusMesh.alignment = TextAlignment.Center;
        _statusMesh.color = Color.green;
        if(font) _statusMesh.font = font;
    }

    void Update()
    {
        if (_statusMesh && _spawner)
        {
             _statusMesh.text = $"● LIVE SCAN | {_spawner.ActiveCount} PERSONS";
             
             // Look at camera
             if (Camera.main)
             {
                 // Billboard effect for the Text
                 _titleMesh.transform.parent.rotation = Quaternion.LookRotation(_titleMesh.transform.parent.position - Camera.main.transform.position);
             }
        }
    }
}
