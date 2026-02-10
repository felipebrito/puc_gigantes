using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System.Collections.Generic;

public class PhotoProvider : MonoBehaviour
{
    public string serverUrl = "https://localhost:3000/visitors";
    public string serverBase = "https://localhost:3000";
    public float pollInterval = 5.0f;
    
    public VisitorSpawner spawner;

    private HashSet<string> _knownFiles = new HashSet<string>();

    void Start()
    {
        if (!spawner) spawner = FindFirstObjectByType<VisitorSpawner>();
        StartCoroutine(PollRoutine());
    }

    IEnumerator PollRoutine()
    {
        while (true)
        {
            yield return FetchList();
            yield return new WaitForSeconds(pollInterval);
        }
    }

    IEnumerator FetchList()
    {
        using (UnityWebRequest www = UnityWebRequest.Get(serverUrl))
        {
            // Bypass SSL for localhost dev
            www.certificateHandler = new BypassCertificate();
            
            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogWarning("Network Error: " + www.error);
            }
            else
            {
                string json = www.downloadHandler.text;
                List<string> files = ParseSimpleJsonArray(json);
                
                foreach (string file in files)
                {
                    if (!_knownFiles.Contains(file))
                    {
                        _knownFiles.Add(file);
                        StartCoroutine(DownloadTexture(file));
                    }
                }
            }
        }
    }

    IEnumerator DownloadTexture(string filename)
    {
        string url = filename;
        if (!filename.StartsWith("http"))
        {
             url = serverBase + filename;
             if (!filename.StartsWith("/")) url = serverBase + "/" + filename;
        }
        
        Debug.Log($"[PhotoProvider] Requesting texture: {url}");

        using (UnityWebRequest www = UnityWebRequestTexture.GetTexture(url))
        {
            www.certificateHandler = new BypassCertificate();
            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"[PhotoProvider] Error downloading {url}: {www.error}");
            }
            else
            {
                Texture2D texture = DownloadHandlerTexture.GetContent(www);
                if (texture)
                {
                    Debug.Log($"[PhotoProvider] Successfully downloaded {filename} ({texture.width}x{texture.height})");
                    if (spawner) spawner.AddFace(texture);
                }
                else
                {
                    Debug.LogError($"[PhotoProvider] Downloaded content for {filename} is not a valid texture.");
                }
            }
        }
    }

    // Helper to parse ["a.png","b.png"]
    List<string> ParseSimpleJsonArray(string json)
    {
        List<string> result = new List<string>();
        json = json.Trim();
        if (json.StartsWith("[") && json.EndsWith("]"))
        {
            json = json.Substring(1, json.Length - 2);
            string[] parts = json.Split(',');
            foreach (string part in parts)
            {
                string clean = part.Trim().Trim('"');
                if (!string.IsNullOrEmpty(clean))
                    result.Add(clean);
            }
        }
        return result;
    }
}

public class BypassCertificate : CertificateHandler
{
    protected override bool ValidateCertificate(byte[] certificateData)
    {
        return true;
    }
}
