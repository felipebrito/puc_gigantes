// Assets/Editor/SpriteSheetExporter.cs
// Ferramenta para exportar personagens CC2D como sprite sheets para o Three.js
// Acesso: Unity menu → Tools → Sprite Sheet Exporter

using UnityEngine;
using UnityEditor;
using UnityEditor.Animations;
using System.IO;

public class SpriteSheetExporter : EditorWindow
{
    // ── Configurações ────────────────────────────────────────────────
    GameObject  characterPrefab;
    string      animStateName   = "Walk";
    int         frameCount      = 12;       // frames por ciclo de caminhada
    int         frameWidth      = 256;
    int         frameHeight     = 512;
    int         cols            = 4;        // colunas no sprite sheet (4x3 = 12 frames)
    float       cameraSize      = 1.2f;     // tamanho da câmera ortográfica
    Vector3     cameraOffset    = new Vector3(0, 0.6f, 10f); // aponta para o centro do personagem
    string      outputFolder    = ""; // preenchido no OnEnable

    // ── Setup ─────────────────────────────────────────────────────────
    [MenuItem("Tools/Sprite Sheet Exporter")]
    public static void ShowWindow() => GetWindow<SpriteSheetExporter>("Sprite Sheet Exporter");

    void OnEnable()
    {
        // Aponta diretamente para a pasta de sprites do servidor Node.js
        outputFolder = Path.GetFullPath(
            Path.Combine(Application.dataPath, "../../server/public/sprites"));
    }

    // ── GUI ───────────────────────────────────────────────────────────
    void OnGUI()
    {
        GUILayout.Label("🦕 Sprite Sheet Exporter — Gigantes de POA", EditorStyles.boldLabel);
        EditorGUILayout.Space();

        characterPrefab = (GameObject)EditorGUILayout.ObjectField(
            "Prefab do Personagem", characterPrefab, typeof(GameObject), false);

        animStateName = EditorGUILayout.TextField("Nome do Estado de Animação", animStateName);
        frameCount    = EditorGUILayout.IntSlider("Frames por ciclo", frameCount, 6, 24);
        cols          = EditorGUILayout.IntSlider("Colunas no sheet", cols, 2, 6);
        frameWidth    = EditorGUILayout.IntField("Largura do frame (px)", frameWidth);
        frameHeight   = EditorGUILayout.IntField("Altura do frame (px)", frameHeight);
        cameraSize    = EditorGUILayout.Slider("Tamanho câmera ortho", cameraSize, 0.5f, 3f);
        cameraOffset  = EditorGUILayout.Vector3Field("Offset câmera", cameraOffset);

        EditorGUILayout.Space();
        EditorGUILayout.LabelField("Saída:", outputFolder, EditorStyles.miniLabel);
        if (GUILayout.Button("Escolher pasta de saída"))
        {
            string path = EditorUtility.OpenFolderPanel("Pasta de saída", outputFolder, "");
            if (!string.IsNullOrEmpty(path)) outputFolder = path;
        }

        EditorGUILayout.Space();

        GUI.enabled = characterPrefab != null;
        if (GUILayout.Button("⚡ Exportar Sprite Sheet", GUILayout.Height(40)))
            Export();
        GUI.enabled = true;

        if (characterPrefab == null)
            EditorGUILayout.HelpBox("Arraste um prefab CC2D do campo Personagens/", MessageType.Info);
    }

    // ── Exportação ────────────────────────────────────────────────────
    void Export()
    {
        int rows         = Mathf.CeilToInt((float)frameCount / cols);
        int sheetWidth   = cols * frameWidth;
        int sheetHeight  = rows * frameHeight;

        // Instanciar personagem fora da câmera principal
        var go = (GameObject)PrefabUtility.InstantiatePrefab(characterPrefab);
        go.transform.position = new Vector3(999, 0, 0);
        go.transform.rotation = Quaternion.identity;

        // Ativar animação de caminhada
        var animator = go.GetComponent<Animator>();
        if (animator == null)
        {
            Debug.LogError("[Exporter] Prefab não tem Animator!");
            DestroyImmediate(go);
            return;
        }
        animator.SetBool("Walk", true);
        animator.SetFloat("Speed", 1f);

        // Câmera ortográfica dedicada com fundo transparente
        var camGo = new GameObject("_ExportCam");
        var cam   = camGo.AddComponent<Camera>();
        cam.orthographic     = true;
        cam.orthographicSize = cameraSize;
        cam.clearFlags       = CameraClearFlags.SolidColor;
        cam.backgroundColor  = new Color(0, 0, 0, 0); // totalmente transparente
        cam.transform.position = go.transform.position + cameraOffset;
        cam.transform.LookAt(go.transform.position + Vector3.up * 0.6f);
        cam.cullingMask      = ~0; // tudo

        // RenderTexture com canal alpha
        var rt = new RenderTexture(frameWidth, frameHeight, 24, RenderTextureFormat.ARGB32);
        rt.antiAliasing = 2;
        cam.targetTexture = rt;

        // Sprite sheet final
        var sheet = new Texture2D(sheetWidth, sheetHeight, TextureFormat.RGBA32, false);

        // Capturar cada frame
        for (int i = 0; i < frameCount; i++)
        {
            float normalizedTime = (float)i / frameCount;

            // Avançar animação para o instante correto
            animator.Play(animStateName, 0, normalizedTime);
            animator.Update(0f);

            // Renderizar
            cam.Render();

            // Ler pixels do RenderTexture
            RenderTexture.active = rt;
            var frame = new Texture2D(frameWidth, frameHeight, TextureFormat.RGBA32, false);
            frame.ReadPixels(new Rect(0, 0, frameWidth, frameHeight), 0, 0);
            frame.Apply();
            RenderTexture.active = null;

            // Posição no sprite sheet (esquerda-para-direita, cima-para-baixo)
            int col = i % cols;
            int row = i / cols;
            // Unity Texture2D: y=0 é embaixo, então invertemos a linha
            int destY = sheetHeight - (row + 1) * frameHeight;

            sheet.SetPixels(col * frameWidth, destY, frameWidth, frameHeight, frame.GetPixels());
            DestroyImmediate(frame);

            EditorUtility.DisplayProgressBar("Exportando Sprite Sheet",
                $"Frame {i + 1} / {frameCount}", (float)(i + 1) / frameCount);
        }

        EditorUtility.ClearProgressBar();
        sheet.Apply();

        // Salvar PNG
        Directory.CreateDirectory(outputFolder);
        string prefabName = characterPrefab.name.Replace(" ", "_").ToLower();
        string fileName   = $"spritesheet_{prefabName}_{cols}x{rows}_{frameCount}f.png";
        string filePath   = Path.Combine(outputFolder, fileName);
        File.WriteAllBytes(filePath, sheet.EncodeToPNG());

        // Salvar também um JSON de metadados para o Three.js
        string meta = $@"{{
  ""name"": ""{prefabName}"",
  ""frameCount"": {frameCount},
  ""cols"": {cols},
  ""rows"": {rows},
  ""frameWidth"": {frameWidth},
  ""frameHeight"": {frameHeight},
  ""sheetWidth"": {sheetWidth},
  ""sheetHeight"": {sheetHeight},
  ""fps"": 12,
  ""file"": ""{fileName}""
}}";
        File.WriteAllText(Path.Combine(outputFolder, $"{prefabName}.json"), meta);

        // Limpeza
        DestroyImmediate(go);
        DestroyImmediate(camGo);
        rt.Release();
        DestroyImmediate(rt);

        Debug.Log($"[Exporter] ✅ Sprite sheet salvo em: {filePath}");
        EditorUtility.RevealInFinder(filePath);
    }
}
