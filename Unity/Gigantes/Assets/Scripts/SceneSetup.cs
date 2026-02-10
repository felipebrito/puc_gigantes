using UnityEngine;

public class SceneSetup : MonoBehaviour
{
    void Start()
    {
        SetupGround();
        SetupGrid();
        SetupDino();
    }

    void SetupGround()
    {
        GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
        ground.name = "Ground";
        ground.transform.position = new Vector3(0, -3.01f, 0);
        ground.transform.localScale = new Vector3(100, 1, 100);
        Renderer r = ground.GetComponent<Renderer>();
        r.material.color = new Color(0.2f, 0.2f, 0.2f);
    }

    void SetupGrid()
    {
        // Simple lines using LineRenderer or long thin cubes
        // React: <Grid infiniteGrid sectionSize={2} cellSize={1} ... />
        // And manual height markers: [0, 1, 2, 3, 4, 5, 6].map ...
        
        GameObject gridRoot = new GameObject("Grid");
        
        // Height markers
        for (int h = 0; h <= 6; h++)
        {
            GameObject marker = GameObject.CreatePrimitive(PrimitiveType.Cube);
            marker.transform.parent = gridRoot.transform;
            marker.transform.position = new Vector3(-8 + 0.5f, -3 + h, 0);
            marker.transform.localScale = new Vector3(0.4f, 0.05f, 0.05f);
            marker.GetComponent<Renderer>().material.color = new Color(1, 0.8f, 0); // #ffcc00
            
            // Text Label
            GameObject textObj = new GameObject("Label_" + h);
            textObj.transform.parent = gridRoot.transform;
            textObj.transform.position = new Vector3(-8 + 0.8f, -3 + h, 0);
            TextMesh tm = textObj.AddComponent<TextMesh>();
            tm.text = h + "m";
            tm.fontSize = 20;
            tm.characterSize = 0.2f;
            tm.color = Color.white;
            tm.anchor = TextAnchor.MiddleLeft;
        }

        // Vertical bar
        GameObject bar = GameObject.CreatePrimitive(PrimitiveType.Cube);
        bar.transform.parent = gridRoot.transform;
        bar.transform.position = new Vector3(-8, -3 + 3, 0);
        bar.transform.localScale = new Vector3(0.2f, 6, 0.2f);
        bar.GetComponent<Renderer>().material.color = new Color(0.2f, 0.13f, 0); // #332200
    }

    void SetupDino()
    {
        // Load GLB
        // Unity doesn't load GLB at runtime natively without packages (GLTFast).
        // BUT, since we are in Editor (mostly), we usually import it as an Asset.
        // If we want runtime loading we need a library.
        // For this port, we assumed 'Assets/Resources/Models/Dino.glb' exists.
        // Unity imports .glb as a GameObject if the importer is active.
        // We can try loading it as a GameObject from Resources.
        
        GameObject dinoPrefab = Resources.Load<GameObject>("Models/Dino");
        if (dinoPrefab)
        {
            GameObject dino = Instantiate(dinoPrefab);
            dino.transform.position = new Vector3(0, -3, -15);
            dino.transform.localScale = Vector3.one * 3.0f * 0.4f; // 3.0 from group, 0.4 from Dinosaur comp
            dino.transform.rotation = Quaternion.Euler(0, 0, 0); // React had Y rotation anim
            
            // Add simple animation script
            dino.AddComponent<SimpleDinoAnim>();
        }
        else
        {
            Debug.LogWarning("Dino model not found in Resources/Models/Dino");
            // Placeholder
            GameObject p = GameObject.CreatePrimitive(PrimitiveType.Cube);
            p.transform.position = new Vector3(0, 0, -10);
            p.transform.localScale = new Vector3(2, 6, 2);
            p.GetComponent<Renderer>().material.color = Color.red;
        }
    }
}

public class SimpleDinoAnim : MonoBehaviour
{
    float t = 0;
    void Update()
    {
        t += Time.deltaTime;
        transform.Rotate(0, Mathf.Sin(t * 0.1f) * 0.1f, 0); // Very subtle
        transform.position += new Vector3(0, Mathf.Sin(t * 0.5f) * 0.0005f, 0);
    }
}
