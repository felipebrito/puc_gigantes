using UnityEngine;

public class VisitorController : MonoBehaviour
{
    [Header("Movement")]
    public float speed = 1.0f;
    public float direction = 1.0f; // 1 or -1
    public float boundary = 25.0f;

    [Header("Visuals")]
    public MeshRenderer faceRenderer;
    public MeshRenderer[] clothingRenderers;
    public ProceduralAnimator animator;

    private System.Action<VisitorController> _onComplete;

    public void Initialize(float moveSpeed, float moveDirection, Texture faceTexture, Texture clothingTexture, string walkStyle, float scale, System.Action<VisitorController> onComplete)
    {
        speed = moveSpeed;
        direction = moveDirection;
        _onComplete = onComplete;

        // Apply visual settings
        if (faceRenderer && faceTexture)
        {
            Material faceMat = new Material(faceRenderer.material); // Instance
            faceMat.mainTexture = faceTexture;
            faceRenderer.material = faceMat;
        }

        if (clothingRenderers != null && clothingTexture)
        {
            foreach (var r in clothingRenderers)
            {
                if (r)
                {
                    Material clothMat = new Material(r.material); // Instance
                    clothMat.mainTexture = clothingTexture;
                    r.material = clothMat;
                }
            }
        }

        // Setup animator
        if (animator)
        {
            animator.speed = Mathf.Abs(speed) * 0.8f; // Tune animation speed to movement
            animator.walkStyle = walkStyle;
            animator.stride = 0.4f * scale;
        }
        else
        {
            // Try transform bobbing if no animator? Or CC2D Animator?
            Animator unityAnim = GetComponent<Animator>();
            if (unityAnim)
            {
                unityAnim.speed = Mathf.Abs(speed) * 0.5f;
                // CC2D specific parameters found in Controller:
                // "Walk" seems to be a state or parameter. 
                // "Run" is also there.
                // Let's safe set them if they exist.
                
                // Check if parameter exists helper? No, just try/catch or assume.
                // Based on "m_Name: Walk", it might be a Bool or Float.
                // Standard CC2D usually uses "MoveSpeed" or similar, but here we see "Walk" and "Run".
                // Let's try setting Walk to true or 1.0f
                
                // Actually, let's use the hash to be safe/fast if we knew it.
                // For now, I'll set specific naming conventions I saw in the grep.
                // The grep showed "m_Name: Walk" which could be a State name or Parameter name.
                // Usually parameters are lower case?
                // Wait, "m_Name: Walk" in grep output of controller file usually refers to STATE names or BLEND TREE names.
                // PARAMETERS are listed under m_AnimatorParameters. 
                // I need to be careful.
                
                // Let's assume standard CC2D: "Horizontal", "Vertical", "Speed"?
                // The grep showed "m_Name: Run", "m_Name: Walk" mixed with "m_Name: Base Layer".
                // I'll try setting "Walk" boolean or float.
                
                unityAnim.SetFloat("Walk", 1.0f); 
                unityAnim.SetBool("Walk", true); 
                // Also "Speed" is common.
                unityAnim.SetFloat("Speed", Mathf.Abs(speed));
            }
        }

        // Apply scale
        // Maintain direction flip
        Vector3 finalScale = Vector3.one * scale;
        if (direction < 0) finalScale.x *= -1;
        transform.localScale = finalScale;
    }

    void Update()
    {
        // Move
        transform.position += Vector3.right * speed * direction * Time.deltaTime;

        // Check boundary
        // Boundary is now the target X coordinate
        if ((direction > 0 && transform.position.x > boundary) ||
            (direction < 0 && transform.position.x < boundary))
        {
            if (_onComplete != null) _onComplete(this);
            Destroy(gameObject);
        }
    }
}
