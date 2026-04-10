// Assets/Editor/SpriteSheetExporter.cs
// Ferramenta para exportar personagens CC2D como sprite sheets para o Three.js
// Acesso: Unity menu → Tools → Sprite Sheet Exporter

using UnityEngine;
using UnityEditor;
using System.IO;

public class SpriteSheetExporter : EditorWindow
{
    // ── Configurações ────────────────────────────────────────────────
    GameObject  characterPrefab;
    string      animStateName   = "Walk";
    int         frameCount      = 12;
    int         frameWidth      = 256;
    int         frameHeight     = 512;
    int         cols            = 4;
    float       cameraSize      = 2.0f;
    Vector3     cameraOffset    = new Vector3(0, 2.0f, 10f);
    string      outputFolder    = "";

    float       paddingFactor   = 0.15f;  // margem extra ao redor do personagem (0=justo, 0.2=20%)

    [MenuItem("Tools/Sprite Sheet Exporter")]
    public static void ShowWindow() => GetWindow<SpriteSheetExporter>("Sprite Sheet Exporter");

    void OnEnable()
    {
        // Assets → Gigantes → Unity → PUC → projection/public/sprites
        outputFolder = Path.GetFullPath(
            Path.Combine(Application.dataPath, "../../../projection/public/sprites"));
    }

    void OnGUI()
    {
        GUILayout.Label("Sprite Sheet Exporter — Gigantes de POA", EditorStyles.boldLabel);
        EditorGUILayout.Space();

        characterPrefab = (GameObject)EditorGUILayout.ObjectField(
            "Prefab do Personagem", characterPrefab, typeof(GameObject), false);

        animStateName = EditorGUILayout.TextField("Nome do Estado de Animação", animStateName);
        frameCount    = EditorGUILayout.IntSlider("Frames por ciclo", frameCount, 6, 24);
        cols          = EditorGUILayout.IntSlider("Colunas no sheet", cols, 2, 6);
        frameWidth    = EditorGUILayout.IntField("Largura do frame (px)", frameWidth);
        frameHeight   = EditorGUILayout.IntField("Altura do frame (px)", frameHeight);
        cameraSize    = EditorGUILayout.Slider("Tamanho câmera ortho", cameraSize, 0.5f, 10f);
        cameraOffset  = EditorGUILayout.Vector3Field("Offset câmera", cameraOffset);
        paddingFactor = EditorGUILayout.Slider("Margem (padding)", paddingFactor, 0f, 0.3f);

        EditorGUILayout.Space();
        EditorGUILayout.LabelField("Saída:", outputFolder, EditorStyles.miniLabel);
        if (GUILayout.Button("Escolher pasta de saída"))
        {
            string path = EditorUtility.OpenFolderPanel("Pasta de saída", outputFolder, "");
            if (!string.IsNullOrEmpty(path)) outputFolder = path;
        }

        EditorGUILayout.Space();

        GUI.enabled = characterPrefab != null;

        if (GUILayout.Button("Auto-fit + Exportar  (recomendado)", GUILayout.Height(45)))
            ExportAutoFit();

        EditorGUILayout.Space();
        if (GUILayout.Button("Exportar com configuração manual", GUILayout.Height(30)))
            ExportSingle(cameraSize, cameraOffset.y, "manual");

        GUI.enabled = true;

        if (characterPrefab == null)
            EditorGUILayout.HelpBox("Arraste um prefab CC2D aqui.", MessageType.Warning);
    }

    // Calcula os bounds do personagem em todos os frames da animação e exporta ajustado
    void ExportAutoFit()
    {
        var go = (GameObject)PrefabUtility.InstantiatePrefab(characterPrefab);
        go.transform.position = new Vector3(999, 0, 0);
        go.transform.rotation = Quaternion.identity;

        var animator = go.GetComponent<Animator>();
        if (animator == null)
        {
            Debug.LogError("[Exporter] Prefab não tem Animator!");
            DestroyImmediate(go);
            return;
        }
        animator.SetBool("Walk", true);
        animator.SetFloat("Speed", 1f);

        // Amostrar bounds em todos os frames para pegar o envelope máximo
        float minY =  float.MaxValue;
        float maxY =  float.MinValue;
        float minX =  float.MaxValue;
        float maxX =  float.MinValue;
        int   sampleFrames = Mathf.Max(frameCount, 32);

        for (int i = 0; i < sampleFrames; i++)
        {
            animator.Play(animStateName, 0, (float)i / sampleFrames);
            animator.Update(0f);

            foreach (var r in go.GetComponentsInChildren<Renderer>())
            {
                if (!r.enabled) continue;
                var b = r.bounds;
                minY = Mathf.Min(minY, b.min.y);
                maxY = Mathf.Max(maxY, b.max.y);
                minX = Mathf.Min(minX, b.min.x);
                maxX = Mathf.Max(maxX, b.max.x);
            }
        }

        DestroyImmediate(go);

        if (minY == float.MaxValue)
        {
            Debug.LogError("[Exporter] Nenhum Renderer encontrado no prefab!");
            return;
        }

        float charHeight  = maxY - minY;
        float charWidth   = maxX - minX;
        float centerY     = (minY + maxY) * 0.5f;

        // cameraSize = metade da altura visível; ajusta pelo aspect ratio do frame
        float aspect      = (float)frameWidth / frameHeight;
        float sizeByH     = (charHeight * 0.5f) * (1f + paddingFactor);
        float sizeByW     = (charWidth  * 0.5f / aspect) * (1f + paddingFactor);
        float fitSize     = Mathf.Max(sizeByH, sizeByW);

        // Centraliza horizontalmente no centro visual, não no pivot
        float centerX     = (minX + maxX) * 0.5f;

        Debug.Log($"[Exporter] Bounds: Y={minY:F2}..{maxY:F2}  X={minX:F2}..{maxX:F2}  " +
                  $"→ centerY={centerY:F2}  centerX={centerX:F2}  camSize={fitSize:F2}");

        // Atualiza os campos para o usuário ver
        cameraSize     = fitSize;
        cameraOffset.x = centerX - 999f; // offset relativo à posição do personagem
        cameraOffset.y = centerY;
        Repaint();

        // Salva com nome canônico que o Three.js carrega
        string prefabName  = characterPrefab.name.Replace(" ", "_").ToLower();
        int    rows_       = Mathf.CeilToInt((float)frameCount / cols);
        ExportSingle(fitSize, centerY, "autofit", $"character_walk_{prefabName}_{cols}x{rows_}_{frameCount}f.png");
        EditorUtility.RevealInFinder(outputFolder);
    }

    void ExportSingle(float camSize, float offsetY, string label, string overrideFileName = null)
    {
        int rows        = Mathf.CeilToInt((float)frameCount / cols);
        int sheetWidth  = cols * frameWidth;
        int sheetHeight = rows * frameHeight;

        var go = (GameObject)PrefabUtility.InstantiatePrefab(characterPrefab);
        go.transform.position = new Vector3(999, 0, 0);
        go.transform.rotation = Quaternion.identity;

        var animator = go.GetComponent<Animator>();
        if (animator == null)
        {
            Debug.LogError("[Exporter] Prefab não tem Animator!");
            DestroyImmediate(go);
            return;
        }
        animator.SetBool("Walk", true);
        animator.SetFloat("Speed", 1f);

        var camGo = new GameObject("_ExportCam");
        var cam   = camGo.AddComponent<Camera>();
        cam.orthographic     = true;
        cam.orthographicSize = camSize;
        cam.clearFlags       = CameraClearFlags.SolidColor;
        cam.backgroundColor  = new Color(0, 0, 0, 0);
        cam.transform.position = go.transform.position + new Vector3(cameraOffset.x, offsetY, cameraOffset.z);
        cam.transform.LookAt(go.transform.position + Vector3.up * offsetY);
        cam.cullingMask = ~0;

        var rt = new RenderTexture(frameWidth, frameHeight, 24, RenderTextureFormat.ARGB32);
        rt.antiAliasing   = 2;
        cam.targetTexture = rt;

        var sheet = new Texture2D(sheetWidth, sheetHeight, TextureFormat.RGBA32, false);

        for (int i = 0; i < frameCount; i++)
        {
            animator.Play(animStateName, 0, (float)i / frameCount);
            animator.Update(0f);
            cam.Render();

            RenderTexture.active = rt;
            var frame = new Texture2D(frameWidth, frameHeight, TextureFormat.RGBA32, false);
            frame.ReadPixels(new Rect(0, 0, frameWidth, frameHeight), 0, 0);
            frame.Apply();
            RenderTexture.active = null;

            int col  = i % cols;
            int row  = i / cols;
            int destY = sheetHeight - (row + 1) * frameHeight;
            sheet.SetPixels(col * frameWidth, destY, frameWidth, frameHeight, frame.GetPixels());
            DestroyImmediate(frame);
        }

        sheet.Apply();

        string prefabName = characterPrefab.name.Replace(" ", "_").ToLower();
        string fileName   = overrideFileName ?? $"preset_{label}_{prefabName}.png";
        string filePath   = Path.Combine(outputFolder, fileName);
        File.WriteAllBytes(filePath, sheet.EncodeToPNG());

        DestroyImmediate(go);
        DestroyImmediate(camGo);
        rt.Release();
        DestroyImmediate(rt);

        Debug.Log($"[Exporter] Salvo: {fileName}  (size={camSize}, offsetY={offsetY})");
    }
}
