using UnityEngine;

public class VisitorBuilder : MonoBehaviour
{
    public static GameObject CreateVisitor(Texture defaultFace, Texture defaultCloth)
    {
        GameObject root = new GameObject("Visitor");
        VisitorController controller = root.AddComponent<VisitorController>();
        ProceduralAnimator animator = root.AddComponent<ProceduralAnimator>();
        controller.animator = animator;

        // Create Hierarchy
        // Hips
        GameObject hips = CreatePart("Hips", root.transform, new Vector3(0, 0.8f, 0));
        animator.hips = hips.transform;

        // Torso
        GameObject torso = CreateQuad("Torso", hips.transform, new Vector3(0, 0.45f, -0.01f), new Vector2(0.48f, 0.7f), defaultCloth);
        
        // Head Group
        GameObject head = CreatePart("Head", hips.transform, new Vector3(0, 0.75f, 0));
        animator.head = head.transform;
        
        // Face
        GameObject face = CreateQuad("Face", head.transform, new Vector3(0, 0.22f, 0.05f), new Vector2(0.5f, 0.5f), defaultFace);
        controller.faceRenderer = face.GetComponent<MeshRenderer>();

        // Legs
        GameObject legL = CreatePart("LegL", hips.transform, new Vector3(-0.14f, 0.05f, -0.04f));
        GameObject legLMesh = CreateQuad("Mesh", legL.transform, new Vector3(0, -0.4f, 0), new Vector2(0.18f, 0.9f), defaultCloth);
        animator.legL = legL.transform;

        GameObject legR = CreatePart("LegR", hips.transform, new Vector3(0.14f, 0.05f, 0.04f));
        GameObject legRMesh = CreateQuad("Mesh", legR.transform, new Vector3(0, -0.4f, 0), new Vector2(0.18f, 0.9f), defaultCloth);
        animator.legR = legR.transform;

        // Arms
        GameObject armL = CreatePart("ArmL", hips.transform, new Vector3(-0.25f, 0.7f, -0.03f));
        GameObject armLMesh = CreateQuad("Mesh", armL.transform, new Vector3(0, -0.22f, 0), new Vector2(0.12f, 0.48f), defaultCloth);
        animator.armL = armL.transform;

        GameObject armR = CreatePart("ArmR", hips.transform, new Vector3(0.25f, 0.7f, 0.03f));
        GameObject armRMesh = CreateQuad("Mesh", armR.transform, new Vector3(0, -0.22f, 0), new Vector2(0.12f, 0.48f), defaultCloth);
        animator.armR = armR.transform;

        // Assign clothing renderers
        controller.clothingRenderers = new MeshRenderer[] {
            torso.GetComponent<MeshRenderer>(),
            legLMesh.GetComponent<MeshRenderer>(),
            legRMesh.GetComponent<MeshRenderer>(),
            armLMesh.GetComponent<MeshRenderer>(),
            armRMesh.GetComponent<MeshRenderer>()
        };

        return root;
    }

    private static GameObject CreatePart(string name, Transform parent, Vector3 localPos)
    {
        GameObject go = new GameObject(name);
        go.transform.SetParent(parent, false);
        go.transform.localPosition = localPos;
        return go;
    }

    private static GameObject CreateQuad(string name, Transform parent, Vector3 localPos, Vector2 size, Texture texture)
    {
        GameObject go = GameObject.CreatePrimitive(PrimitiveType.Quad);
        go.name = name;
        go.transform.SetParent(parent, false);
        go.transform.localPosition = localPos;
        go.transform.localScale = new Vector3(size.x, size.y, 1);
        
        // Remove collider
        Destroy(go.GetComponent<Collider>());

        // Material
        // Material
        Renderer r = go.GetComponent<Renderer>();
        
        // Try to find URP shader, fallback to Standard or Unlit
        Shader shader = Shader.Find("Universal Render Pipeline/Lit");
        if (!shader) shader = Shader.Find("Universal Render Pipeline/Unlit");
        if (!shader) shader = Shader.Find("Standard");
        
        Material mat = new Material(shader);
        
        if (shader.name.Contains("Universal Render Pipeline"))
        {
            // URP Setup for Transparency
            mat.SetFloat("_Surface", 1); // 1 = Transparent
            mat.SetFloat("_Blend", 0);   // 0 = Alpha
            mat.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
            mat.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
            mat.SetInt("_ZWrite", 0);
            mat.renderQueue = 3000;
            mat.SetColor("_BaseColor", Color.white);
            if (texture) mat.SetTexture("_BaseMap", texture);
        }
        else
        {
            // Standard Shader Setup
            mat.SetFloat("_Mode", 2); // Fade/Transparent
            mat.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
            mat.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
            mat.SetInt("_ZWrite", 0);
            mat.DisableKeyword("_ALPHATEST_ON");
            mat.EnableKeyword("_ALPHABLEND_ON");
            mat.DisableKeyword("_ALPHAPREMULTIPLY_ON");
            mat.renderQueue = 3000;
            if (texture) mat.mainTexture = texture;
        }

        if (texture)
        {
             // Debug.Log($"[VisitorBuilder] Assigning texture {texture.name} to {name}");
             if (shader.name.Contains("Universal Render Pipeline"))
             {
                 mat.SetTexture("_BaseMap", texture);
             }
             else
             {
                 mat.mainTexture = texture;
             }
        }
        else
        {
            Debug.LogWarning($"[VisitorBuilder] No texture provided for {name}");
        }

        r.material = mat;

        return go;
    }
}
