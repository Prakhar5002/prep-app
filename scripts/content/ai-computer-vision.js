window.PREP_SITE.registerTopic({
  id: "ai-computer-vision",
  module: "ai",
  title: "Computer Vision & OpenCV",
  estimatedReadTime: "45 min",
  tags: ["ai","computer-vision","opencv","python","face-recognition","embeddings","liveness","android","ml-kit","on-device"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Images are <strong>arrays</strong>; classical CV is maths on those arrays, deep CV learns the features; face recognition is <strong>detect → align → embed → match</strong> with a threshold calibrated on your own data, plus <strong>liveness</strong> because recognition alone is spoofable.</div>
  <h4>Key points</h4>
  <ul>
    <li>An image is a NumPy array <code>height × width × channels</code>, usually <code>uint8</code> 0–255. OpenCV loads <strong>BGR</strong>, not RGB — forgetting to convert before an RGB-trained model is the most common silent accuracy bug. Arrays are indexed <code>[y, x]</code>; functions take (x, y) points and (width, height) sizes.</li>
    <li>Colour spaces: gray for edges/thresholds, HSV for colour segmentation, YUV from Android cameras, LAB + CLAHE for lighting normalisation.</li>
    <li>Classical toolkit: blur → Canny / Otsu / adaptive threshold → morphology → contours → geometry (perspective warp); ORB/SIFT + ratio test + RANSAC for matching.</li>
    <li><strong>Pipeline thinking:</strong> capture → pre-process (resize, colour convert, normalise) → detect (where?) → align/crop → model (what?) → post-process (thresholds, NMS, tracking) → decision.</li>
    <li>Classical wins in controlled scenes; deep models win in uncontrolled ones; production mixes both.</li>
    <li>Alignment to the model's canonical template (5 landmarks, similarity transform, e.g. a 112×112 crop with eyes at fixed points) is not optional.</li>
    <li>The embedder outputs 128–512 floats; embeddings are L2-normalised so cosine = dot product; matching is nearest-neighbour search.</li>
    <li>Threshold trades FAR vs FRR; set it from a business FAR target on genuine/impostor pairs from the real deployment.</li>
    <li>1:N needs a stricter threshold and a <strong>margin over the second-best person</strong>; include a grey zone with retry/fallback.</li>
    <li>Liveness (PAD) is separate: passive model, active challenge, or depth/IR; measured with APCER/BPCER.</li>
    <li>On Android: CameraX keep-only-latest, ML Kit for detection (not recognition), TFLite/LiteRT quantised MobileFaceNet-class embedder; drop frames rather than queue them; keep frames native in RN.</li>
    <li>Model upgrades invalidate templates — version them and migrate like a schema.</li>
    <li>Biometric data: consent, alternative path, retention, encryption, deletion on exit.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Copying a threshold (and an accuracy number) from a paper.</strong> Benchmarks are curated and frontal; your camera, lighting and population shift both score distributions. Calibrate on your own genuine/impostor pairs, and for 1:N add a margin rule — otherwise either the queue grows (FRR) or the wrong person checks in (FAR).</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Face recognition is detect, align, embed, match — and I treat the threshold as a business decision calibrated on deployment data, with a margin rule for 1:N and a grey zone that falls back to a PIN."</div>
  <div class="revision-say">"Recognition answers who; liveness answers whether it's a real person in front of the camera — they're separate models with separate metrics."</div>
  <div class="revision-say">"I reach for classical OpenCV first in controlled scenes and keep deep models for the parts that really need learning — and on mobile I keep frames native and only send results to JS."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What computer vision covers</h3>
<table>
  <thead><tr><th>Task</th><th>Question it answers</th><th>Output</th><th>Typical tool</th></tr></thead>
  <tbody>
    <tr><td>Classification</td><td>What is in this image?</td><td>Label + probability</td><td>CNN / ViT (MobileNet, EfficientNet)</td></tr>
    <tr><td>Detection</td><td>Where are the objects?</td><td>Boxes + labels + scores</td><td>YOLO-family, SSD, YuNet (faces), ML Kit</td></tr>
    <tr><td>Segmentation</td><td>Which pixels belong to what?</td><td>Per-pixel mask</td><td>U-Net, Mask R-CNN, SAM-style models</td></tr>
    <tr><td>Keypoints / pose</td><td>Where are the landmarks?</td><td>(x, y) points</td><td>Face landmarks, body pose models</td></tr>
    <tr><td>Recognition / re-identification</td><td>Is this the same person/object as before?</td><td>Embedding vector + similarity</td><td>ArcFace / SFace / MobileFaceNet</td></tr>
    <tr><td>OCR</td><td>What does the text say?</td><td>Strings + positions</td><td>Tesseract, ML Kit Text Recognition, cloud OCR</td></tr>
    <tr><td>Measurement / inspection</td><td>Is this part the right size / defect-free?</td><td>Numbers, pass/fail</td><td>Classical OpenCV (contours, thresholds) — often enough</td></tr>
  </tbody>
</table>

<h3>Why an app / full-stack engineer gets asked about it</h3>
<ul>
  <li><strong>Product features ship on phones and kiosks:</strong> document scanning, ID capture, barcode/QR, face check-in, AR overlays. The engineer who owns the app owns the camera pipeline, latency budget and failure UX.</li>
  <li><strong>Forward-deployed work is messy-data work:</strong> a customer's cameras, lighting and users are never the ones in the benchmark. Knowing <em>why</em> accuracy drops (blur, backlight, pose, BGR/RGB, resize distortion) is what unblocks a deployment.</li>
  <li><strong>Privacy and regulation:</strong> face data is biometric data in most jurisdictions. Design choices — store embeddings not photos, on-device vs server matching, consent, retention — are engineering decisions with legal weight.</li>
</ul>

<h3>What OpenCV is (and is not)</h3>
<p><strong>OpenCV</strong> is a large open-source C++ library with Python/Java bindings for image I/O, colour conversion, filtering, geometry (warps, homographies, calibration), feature detection, video I/O, and a <code>dnn</code> module that runs pre-trained networks (ONNX, Caffe, TensorFlow exports) for inference. It is <em>not</em> a training framework — you train in PyTorch/TensorFlow, export (usually to ONNX or TFLite), and run inference in OpenCV, ONNX Runtime, TFLite/LiteRT or a vendor runtime.</p>

<h3>Classical vs deep — when each wins</h3>
<table>
  <thead><tr><th></th><th>Classical (hand-designed)</th><th>Deep learning (learned)</th></tr></thead>
  <tbody>
    <tr><td>Data needed</td><td>None / a few examples to tune</td><td>Thousands+ labelled (or a pre-trained model)</td></tr>
    <tr><td>Controlled scene (factory line, scanner)</td><td>Excellent, explainable, fast</td><td>Overkill</td></tr>
    <tr><td>Uncontrolled scene (faces in a lobby)</td><td>Brittle (Haar cascades miss turned faces)</td><td>Robust</td></tr>
    <tr><td>Compute</td><td>Microseconds–milliseconds on CPU</td><td>Milliseconds–seconds; benefits from GPU/NPU</td></tr>
    <tr><td>Debuggability</td><td>Each step visible</td><td>Black box; needs eval sets</td></tr>
    <tr><td>Role in a modern pipeline</td><td>Pre/post-processing, geometry, quality checks</td><td>Detection, embedding, classification</td></tr>
  </tbody>
</table>
<div class="callout note">
  <div class="callout-title">Running worked example in this topic</div>
  <p>A <strong>face-recognition attendance kiosk</strong>: an Android tablet at an office entrance. Employees are enrolled once (a few photos → stored templates). At check-in the tablet's front camera finds a face, verifies it is a live person, computes an embedding, matches it against enrolled templates, and marks attendance — in well under a second, offline-tolerant, without storing raw photos longer than needed.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>1. An image is an array</h3>
<div class="diagram">
<pre>
 img.shape == (480, 640, 3)      # rows (H), cols (W), channels
 img.dtype == uint8               # 0..255 per channel

        x (column) →
     ┌──────────────────────┐
   y │ [B,G,R] [B,G,R] ...  │   img[y, x]  -&gt;  array([B, G, R])
   ↓ │ [B,G,R] [B,G,R] ...  │   note: row first, then column
     └──────────────────────┘   OpenCV points are (x, y) — the opposite order!
</pre>
</div>
<p>Two indexing conventions bite everyone: NumPy is <code>img[row, col]</code> = <code>img[y, x]</code>, but OpenCV functions take points as <code>(x, y)</code> and sizes as <code>(width, height)</code>. <code>cv2.resize(img, (w, h))</code> — width first.</p>

<h3>2. Colour spaces are just different coordinate systems</h3>
<table>
  <thead><tr><th>Space</th><th>Channels</th><th>Use it for</th></tr></thead>
  <tbody>
    <tr><td>BGR / RGB</td><td>Blue, Green, Red</td><td>Storage, display, model input (check which one the model expects)</td></tr>
    <tr><td>Grayscale</td><td>Luminance</td><td>Edges, thresholds, classical detectors, 3× less data</td></tr>
    <tr><td>HSV</td><td>Hue, Saturation, Value</td><td>Colour segmentation robust to brightness ("find the green marker")</td></tr>
    <tr><td>YCrCb / YUV</td><td>Luma + 2 chroma</td><td>Camera frames on Android arrive as YUV_420_888; skin-tone heuristics; equalising only the Y channel</td></tr>
    <tr><td>LAB</td><td>Lightness + 2 colour axes</td><td>Perceptual colour distance; CLAHE on L for lighting normalisation</td></tr>
  </tbody>
</table>

<h3>3. The pipeline picture (kiosk)</h3>
<div class="diagram">
<pre>
 Camera frame (YUV, 30 fps)
     │  drop frames if busy (keep only latest)
     ▼
 Pre-process: rotate to upright, downscale, YUV→RGB
     ▼
 DETECT  ── no face / &gt;1 face / too small / blurry ─► UI hint ("come closer")
     │ box + 5 landmarks (eyes, nose, mouth corners)
     ▼
 LIVENESS (passive model and/or blink/turn challenge) ── fail ─► reject
     ▼
 ALIGN: similarity transform landmarks → canonical 112×112 crop
     ▼
 EMBED: CNN → 128/512-d vector → L2-normalise
     ▼
 MATCH: cosine vs enrolled templates (1:N)
     │   best ≥ accept threshold AND margin over 2nd best ≥ δ ?
     ▼
 DECIDE: accept → mark attendance │ grey zone → retry / PIN fallback │ reject
</pre>
</div>

<h3>4. Verification vs identification</h3>
<ul>
  <li><strong>1:1 verification</strong> — "Is this person who they claim to be?" (badge tap + face). One comparison; error rates stay low.</li>
  <li><strong>1:N identification</strong> — "Who among N enrolled people is this?" (walk-up kiosk). N comparisons; the chance that <em>some</em> impostor template crosses the threshold grows with N, so 1:N needs a stricter threshold, a margin rule, or a claim step to keep false accepts down.</li>
</ul>

<h3>5. Embeddings: why matching is just geometry</h3>
<p>The embedding network is trained (ArcFace-style angular-margin losses) so that photos of the same person land close together on a hypersphere and different people land far apart. After L2-normalising, <strong>cosine similarity = dot product</strong>. Recognition becomes nearest-neighbour search — the same idea as <a href="#/topic/ai-vector-search">vector search</a> for text embeddings.</p>
<div class="diagram">
<pre>
 genuine pairs  (same person)   ▁▂▅█▇▃▁            scores near 0.6–0.9
 impostor pairs (diff people) ▁▃█▆▂▁                scores near 0.0–0.3
                     ───────────────|──────────────► cosine
                                threshold t
          left of t on genuine curve = false rejects (FRR)
          right of t on impostor curve = false accepts (FAR)
</pre>
</div>
<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Accuracy is 99.8% on LFW so our kiosk will be 99.8% accurate." Benchmark numbers are on curated, mostly frontal, well-lit celebrity photos. A backlit glass lobby, a tablet mounted too low, and masks or helmets move both distributions. Always build an evaluation set from <em>your</em> camera before quoting a number.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Loading, colour conversion, resizing</h3>
<pre><code class="language-python">import cv2
import numpy as np

img = cv2.imread("frame.jpg")            # BGR, uint8, shape (H, W, 3); returns None if path is bad
if img is None:
    raise FileNotFoundError("frame.jpg")

rgb  = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)   # for models trained on RGB
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
hsv  = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)   # OpenCV hue range is 0..179, not 0..359

h, w = img.shape[:2]
scale = 320 / max(h, w)
small = cv2.resize(img, (int(w * scale), int(h * scale)),   # (width, height)!
                   interpolation=cv2.INTER_AREA)            # AREA for shrinking, LINEAR/CUBIC for enlarging

# Normalise for a network: float32, 0..1 or mean/std, NCHW layout
blob = cv2.dnn.blobFromImage(small, scalefactor=1/255.0, size=(320, 320),
                             mean=(0, 0, 0), swapRB=True, crop=False)
print(blob.shape)  # (1, 3, 320, 320)</code></pre>

<h3>2. Filtering and noise</h3>
<pre><code class="language-python">blur     = cv2.GaussianBlur(gray, (5, 5), 0)      # smooth Gaussian noise before edges/thresholds
median   = cv2.medianBlur(gray, 5)                # salt-and-pepper noise, keeps edges better
bilat    = cv2.bilateralFilter(img, 9, 75, 75)    # edge-preserving smoothing (slow)

# Blur / focus check: variance of the Laplacian. Low variance = few sharp edges = blurry.
def sharpness(gray_img):
    return cv2.Laplacian(gray_img, cv2.CV_64F).var()

# Lighting normalisation: CLAHE (contrast-limited adaptive histogram equalisation)
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
l, a, b = cv2.split(lab)
img_eq = cv2.cvtColor(cv2.merge((clahe.apply(l), a, b)), cv2.COLOR_LAB2BGR)</code></pre>
<p>A convolution kernel slides over the image and replaces each pixel with a weighted sum of its neighbours. Blur kernels average; edge kernels (Sobel, Laplacian) take differences. Every CNN layer is a stack of <em>learned</em> kernels — the classical intuition carries straight over.</p>

<h3>3. Edges and thresholds</h3>
<pre><code class="language-python">edges = cv2.Canny(blur, threshold1=50, threshold2=150)   # hysteresis: strong &gt;150, weak 50..150 kept if connected

# Global threshold with Otsu choosing the value automatically from the histogram
t, bw = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

# Adaptive threshold: per-neighbourhood, handles uneven lighting (documents, receipts)
bw_adapt = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                 cv2.THRESH_BINARY, blockSize=31, C=10)

# Morphology cleans masks: open = erode then dilate (removes specks), close = fills holes
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
mask = cv2.morphologyEx(bw, cv2.MORPH_OPEN, kernel)</code></pre>

<h3>4. Contours — classical "find the object"</h3>
<pre><code class="language-python"># OpenCV 4.x returns (contours, hierarchy); OpenCV 3.x returned 3 values — a classic version bug
contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

for c in sorted(contours, key=cv2.contourArea, reverse=True)[:5]:
    area = cv2.contourArea(c)
    if area &lt; 1000:
        continue
    x, y, w, h = cv2.boundingRect(c)
    peri = cv2.arcLength(c, True)
    approx = cv2.approxPolyDP(c, 0.02 * peri, True)
    if len(approx) == 4:
        # a quadrilateral: candidate document / ID card -&gt; perspective-warp it flat
        pts = approx.reshape(4, 2).astype(np.float32)
        # (order pts TL, TR, BR, BL first in real code)
        dst = np.float32([[0, 0], [600, 0], [600, 380], [0, 380]])
        M = cv2.getPerspectiveTransform(pts, dst)
        card = cv2.warpPerspective(img, M, (600, 380))</code></pre>

<h3>5. Feature detection and matching</h3>
<p>Keypoint detectors find distinctive corners/blobs; descriptors encode the patch around them so the same point can be found in another image. Used for panorama stitching, AR anchoring, "is this the same product label", and estimating homographies.</p>
<pre><code class="language-python">orb = cv2.ORB_create(nfeatures=1000)            # free, fast, binary descriptors
kp1, des1 = orb.detectAndCompute(gray1, None)
kp2, des2 = orb.detectAndCompute(gray2, None)

bf = cv2.BFMatcher(cv2.NORM_HAMMING)            # Hamming distance for binary descriptors
matches = bf.knnMatch(des1, des2, k=2)
good = [m for m, n in matches if m.distance &lt; 0.75 * n.distance]   # Lowe's ratio test

if len(good) &gt;= 10:
    src = np.float32([kp1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
    dst = np.float32([kp2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
    H, inliers = cv2.findHomography(src, dst, cv2.RANSAC, 5.0)   # RANSAC rejects outlier matches</code></pre>
<table>
  <thead><tr><th>Detector</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Harris / Shi-Tomasi</td><td>Corners only, no descriptor; good for optical-flow tracking (<code>cv2.goodFeaturesToTrack</code>)</td></tr>
    <tr><td>SIFT</td><td>Scale/rotation invariant, float descriptors, accurate; in main OpenCV since the patent expired (4.4+, <code>cv2.SIFT_create</code>)</td></tr>
    <tr><td>ORB</td><td>FAST + rotated BRIEF, binary, very fast, the default on mobile</td></tr>
    <tr><td>Learned (SuperPoint etc.)</td><td>Better under big viewpoint/lighting change; need a network</td></tr>
  </tbody>
</table>

<h3>6. Face detection — classical to modern</h3>
<pre><code class="language-python"># (a) Haar cascade — 2001-era, ships with OpenCV, fast, frontal-only, many false positives
cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))

# (b) YuNet — small CNN detector in OpenCV's model zoo, returns box + 5 landmarks + score
detector = cv2.FaceDetectorYN.create(
    "face_detection_yunet_2023mar.onnx", "", (320, 320),
    score_threshold=0.85, nms_threshold=0.3, top_k=50)
detector.setInputSize((small.shape[1], small.shape[0]))   # MUST match the frame you pass
_, dets = detector.detect(small)     # dets: N x 15 = [x, y, w, h, 10 landmark coords, score] or None</code></pre>
<p>Model file names/versions above are from the OpenCV model zoo at time of writing — check the current zoo for the latest file. <code>FaceDetectorYN</code> / <code>FaceRecognizerSF</code> need OpenCV 4.5.4+.</p>

<h3>7. Alignment — why and how</h3>
<p>Embedding networks are trained on faces aligned to a fixed template (for 112×112 ArcFace-style models: the two eye centres, nose tip and mouth corners at known coordinates). Feeding an unaligned or differently-cropped face shifts the embedding and silently costs accuracy. Alignment is a <strong>similarity transform</strong> (rotation + uniform scale + translation) estimated from the 5 detected landmarks to the 5 template points.</p>
<pre><code class="language-python">ARCFACE_112 = np.array([[38.2946, 51.6963], [73.5318, 51.5014], [56.0252, 71.7366],
                        [41.5493, 92.3655], [70.7299, 92.2041]], dtype=np.float32)

def align_face(img_bgr, landmarks5):
    """landmarks5: (5, 2) float32 in image pixel coords, order: R-eye, L-eye, nose, R-mouth, L-mouth
       (the order MUST match the template's order for your detector — check it)."""
    M, _ = cv2.estimateAffinePartial2D(landmarks5, ARCFACE_112, method=cv2.LMEDS)
    return cv2.warpAffine(img_bgr, M, (112, 112), borderValue=0)</code></pre>

<h3>8. Embedding and matching with OpenCV's SFace</h3>
<pre><code class="language-python">recognizer = cv2.FaceRecognizerSF.create("face_recognition_sface_2021dec.onnx", "")

def embed(img_bgr, det_row):
    aligned = recognizer.alignCrop(img_bgr, det_row)   # SFace's own alignment from YuNet landmarks
    feat = recognizer.feature(aligned)                 # shape (1, 128), float32
    return feat / np.linalg.norm(feat)                 # L2-normalise once, store normalised

score = recognizer.match(feat_a, feat_b, cv2.FaceRecognizerSF_FR_COSINE)
# OpenCV's sample uses ~0.363 as the cosine "same identity" threshold for SFace —
# a STARTING POINT only. Calibrate on your own genuine/impostor pairs.</code></pre>

<h3>9. Thresholds, FAR/FRR, and the margin rule</h3>
<table>
  <thead><tr><th>Term</th><th>Meaning</th><th>Kiosk consequence</th></tr></thead>
  <tbody>
    <tr><td>FAR / FMR</td><td>Impostor accepted</td><td>Buddy-punching; security incident</td></tr>
    <tr><td>FRR / FNMR</td><td>Genuine user rejected</td><td>Queue at the door, support tickets, users hate it</td></tr>
    <tr><td>EER</td><td>Threshold where FAR = FRR</td><td>Good single-number comparison of models; rarely the right operating point</td></tr>
    <tr><td>ROC / DET curve</td><td>FAR vs FRR across all thresholds</td><td>Pick the point that matches the business risk (e.g. FAR ≤ 0.1% then minimise FRR)</td></tr>
  </tbody>
</table>
<p>For 1:N, accept only if <code>best ≥ t_accept</code> <strong>and</strong> <code>best − second_best ≥ δ</code> (where second best is a <em>different</em> person). A grey zone between <code>t_reject</code> and <code>t_accept</code> triggers a retry or a fallback (PIN, badge, manual approval) instead of a coin-flip.</p>

<h3>10. Liveness / anti-spoofing basics</h3>
<table>
  <thead><tr><th>Approach</th><th>How</th><th>Stops</th><th>Weakness</th></tr></thead>
  <tbody>
    <tr><td>Passive RGB model</td><td>CNN classifies a crop as live vs attack (moiré, paper texture, screen glare, borders)</td><td>Prints, most phone replays</td><td>Domain shift: new camera/lighting needs re-validation</td></tr>
    <tr><td>Active challenge</td><td>Blink, smile, turn head; check landmark motion over frames</td><td>Static photos</td><td>Slower UX; video replay can pass naive checks</td></tr>
    <tr><td>Depth / IR hardware</td><td>Structured light, ToF, NIR cameras</td><td>Flat attacks very well</td><td>Hardware cost; not on standard tablets</td></tr>
    <tr><td>Multi-frame consistency</td><td>Micro-motion, rPPG (pulse from skin colour), 3D consistency</td><td>Stills</td><td>Sensitive to lighting, compute-heavy</td></tr>
  </tbody>
</table>
<p>The standard vocabulary is <strong>Presentation Attack Detection (PAD)</strong>, evaluated per ISO/IEC 30107-3 (APCER = attacks wrongly accepted, BPCER = bona fide users wrongly rejected). Saying those terms in an interview signals you know it is its own measurable problem.</p>

<h3>11. On-device (Android) notes</h3>
<ul>
  <li><strong>Camera:</strong> CameraX <code>ImageAnalysis</code> with <code>STRATEGY_KEEP_ONLY_LATEST</code> so analysis never builds a backlog; frames arrive as <code>YUV_420_888</code> with a rotation value you must apply.</li>
  <li><strong>Detection:</strong> Google ML Kit Face Detection gives boxes, landmarks/contours, head angles (Euler X/Y/Z), and eye-open / smiling probabilities (useful for blink challenges and pose gating). It does <strong>not</strong> do recognition — you bring the embedding model.</li>
  <li><strong>Embedding:</strong> a MobileFaceNet-class model exported to TFLite (now branded LiteRT), int8 or float16 quantised, run with the GPU/NNAPI delegate where available; check delegate support per device — fall back to CPU threads.</li>
  <li><strong>OpenCV on Android:</strong> available as an Android SDK (Java/Kotlin bindings) when you need classical ops; it adds megabytes to the APK, so many teams only use it for warps and do the rest in ML Kit + TFLite.</li>
  <li><strong>From React Native:</strong> a frame-processor-capable camera library (e.g. VisionCamera frame processors) or a custom native module — the frame must stay native; serialising pixels over the JS bridge per frame is far too slow. See <a href="#/topic/rn-native-modules">Native Modules</a>.</li>
</ul>
<pre><code class="language-text">// Kotlin sketch (ML Kit + CameraX), shown as text — check current ML Kit docs for exact options
val options = FaceDetectorOptions.Builder()
    .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
    .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
    .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)   // eye-open probabilities
    .setMinFaceSize(0.25f)
    .build()
val detector = FaceDetection.getClient(options)

imageAnalysis.setAnalyzer(executor) { proxy -&gt;
    val media = proxy.image ?: run { proxy.close(); return@setAnalyzer }
    val input = InputImage.fromMediaImage(media, proxy.imageInfo.rotationDegrees)
    detector.process(input)
        .addOnSuccessListener { faces -&gt; /* gate: exactly 1 face, size, yaw/pitch, eyes */ }
        .addOnCompleteListener { proxy.close() }   // ALWAYS close or the stream stalls
}</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — Kiosk enrolment + matching service (Python, OpenCV)</h3>
<p>A minimal but realistic matcher: enrol several photos per person, keep multiple templates, match with a threshold and margin, and gate on quality first. The same structure ports to Kotlin on-device.</p>
<pre><code class="language-python">from dataclasses import dataclass, field
import cv2
import numpy as np

DET_MODEL = "face_detection_yunet_2023mar.onnx"
REC_MODEL = "face_recognition_sface_2021dec.onnx"

@dataclass
class MatchResult:
    status: str                 # "accept" | "retry" | "reject" | "no_face" | "bad_quality"
    person_id: str | None = None
    score: float = 0.0
    margin: float = 0.0
    reason: str = ""

@dataclass
class FaceMatcher:
    t_accept: float = 0.45      # calibrated on OUR data, not copied from a paper
    t_reject: float = 0.30
    min_margin: float = 0.08
    min_face_px: int = 90
    min_sharpness: float = 60.0
    templates: dict = field(default_factory=dict)   # person_id -&gt; np.ndarray (k, 128)

    def __post_init__(self):
        self.det = cv2.FaceDetectorYN.create(DET_MODEL, "", (320, 320), 0.85, 0.3, 50)
        self.rec = cv2.FaceRecognizerSF.create(REC_MODEL, "")

    # ---------- detection + quality gate ----------
    def _single_face(self, img):
        h, w = img.shape[:2]
        self.det.setInputSize((w, h))
        _, dets = self.det.detect(img)
        if dets is None or len(dets) == 0:
            return None, "no_face"
        if len(dets) &gt; 1:
            # pick the largest; a kiosk should prompt "one person at a time" if 2 are similar size
            dets = sorted(dets, key=lambda d: d[2] * d[3], reverse=True)
            if dets[1][2] * dets[1][3] &gt; 0.5 * dets[0][2] * dets[0][3]:
                return None, "multiple_faces"
        d = dets[0]
        if min(d[2], d[3]) &lt; self.min_face_px:
            return None, "too_far"
        x, y, fw, fh = [int(v) for v in d[:4]]
        crop = img[max(y, 0):y + fh, max(x, 0):x + fw]
        if crop.size == 0:
            return None, "out_of_frame"
        sharp = cv2.Laplacian(cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var()
        if sharp &lt; self.min_sharpness:
            return None, "blurry"
        return d, "ok"

    def _embed(self, img, det_row):
        f = self.rec.feature(self.rec.alignCrop(img, det_row)).flatten()
        return f / np.linalg.norm(f)

    # ---------- enrolment ----------
    def enrol(self, person_id, images):
        feats = []
        for img in images:
            d, why = self._single_face(img)
            if d is not None:
                feats.append(self._embed(img, d))
        if len(feats) &lt; 3:
            raise ValueError(f"need 3+ good photos, got {len(feats)}")
        feats = np.stack(feats)
        # consistency check: reject enrolment if photos disagree (wrong person in one shot)
        sims = feats @ feats.T
        if sims[np.triu_indices(len(feats), 1)].min() &lt; self.t_accept:
            raise ValueError("enrolment photos are inconsistent; retake")
        self.templates[person_id] = feats

    # ---------- 1:N identification ----------
    def identify(self, img):
        d, why = self._single_face(img)
        if d is None:
            return MatchResult("no_face" if why == "no_face" else "bad_quality", reason=why)
        q = self._embed(img, d)
        best = {}                                   # best score per PERSON, not per template
        for pid, feats in self.templates.items():
            best[pid] = float((feats @ q).max())
        ranked = sorted(best.items(), key=lambda kv: kv[1], reverse=True)
        if not ranked:
            return MatchResult("reject", reason="no enrolled users")
        pid, s1 = ranked[0]
        s2 = ranked[1][1] if len(ranked) &gt; 1 else -1.0
        margin = s1 - s2
        if s1 &gt;= self.t_accept and margin &gt;= self.min_margin:
            return MatchResult("accept", pid, s1, margin)
        if s1 &gt;= self.t_reject:
            return MatchResult("retry", pid, s1, margin, "grey zone or ambiguous")
        return MatchResult("reject", None, s1, margin, "below threshold")</code></pre>
<p>Notes worth saying out loud: the matcher stores <strong>normalised embeddings only</strong>; best score is aggregated <strong>per person</strong> so having 5 templates for Alice does not crowd Bob out of the second-best slot; and the margin rule is what keeps 1:N false accepts down as headcount grows.</p>

<h3>Example 2 — Calibrating the threshold from your own data</h3>
<pre><code class="language-python">def far_frr_table(genuine: np.ndarray, impostor: np.ndarray, thresholds):
    """genuine: cosine scores of same-person pairs; impostor: different-person pairs."""
    rows = []
    for t in thresholds:
        far = float((impostor &gt;= t).mean())
        frr = float((genuine &lt; t).mean())
        rows.append((round(t, 3), far, frr))
    return rows

# Build pairs from a week of pilot captures (with consent), labelled by badge tap.
table = far_frr_table(genuine_scores, impostor_scores, np.arange(0.25, 0.70, 0.01))
# Choose the LOWEST threshold whose FAR &lt;= 0.001 (business requirement), report its FRR.
candidates = [r for r in table if r[1] &lt;= 0.001]
t_star = min(candidates, key=lambda r: r[0])
print("threshold", t_star[0], "FAR", t_star[1], "FRR", t_star[2])</code></pre>
<p>With 200 employees you have ~200 × 5 genuine pairs but ~20,000+ impostor pairs per photo — impostor statistics are cheap, genuine ones are the bottleneck. A FAR target of 0.1% needs thousands of impostor comparisons to be measurable at all; quote confidence, not a single number.</p>

<h3>Example 3 — Fast 1:N search at scale</h3>
<pre><code class="language-python"># 50k enrolled templates x 128 floats = 6.4M floats ~ 25 MB float32: brute force is fine on a server.
T = np.vstack(all_feats).astype(np.float32)      # (M, 128), each row L2-normalised
owners = np.array(all_owner_ids)                 # (M,)
scores = T @ q                                   # one matrix-vector product, ~ms on CPU
top = np.argpartition(-scores, 10)[:10]          # top-10 without full sort
# Beyond ~millions of templates, use an ANN index (FAISS / HNSW) — same idea as text vector search.</code></pre>

<h3>Example 4 — Classical CV win: document capture</h3>
<pre><code class="language-python">def find_document(img):
    gray = cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), (5, 5), 0)
    edges = cv2.Canny(gray, 50, 150)
    edges = cv2.dilate(edges, None, iterations=1)                 # close small gaps
    cnts, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    for c in sorted(cnts, key=cv2.contourArea, reverse=True)[:5]:
        approx = cv2.approxPolyDP(c, 0.02 * cv2.arcLength(c, True), True)
        if len(approx) == 4 and cv2.contourArea(approx) &gt; 0.2 * img.shape[0] * img.shape[1]:
            return approx.reshape(4, 2)
    return None    # fall back to "hold steady" hint or a learned edge detector</code></pre>
<p>No model, no training data, runs in a few milliseconds — the right answer when the scene is controlled. Interviewers like candidates who do not reach for deep learning by reflex.</p>

<h3>Example 5 — Where the work runs: decision table for the kiosk</h3>
<table>
  <thead><tr><th>Design</th><th>Latency</th><th>Offline?</th><th>Privacy</th><th>Ops cost</th></tr></thead>
  <tbody>
    <tr><td>All on device (detect, liveness, embed, match vs locally synced templates)</td><td>Lowest (~100–300 ms typical on mid-range tablets — measure)</td><td>Yes</td><td>Templates live on the device → encrypt at rest, wipe on unenrol</td><td>Model updates need app/OTA releases</td></tr>
    <tr><td>Detect on device, embed + match on server</td><td>+ network round trip (crop upload)</td><td>No (queue + retry)</td><td>Face crops leave the device</td><td>Central model upgrades, GPU fleet</td></tr>
    <tr><td>Embed on device, match on server</td><td>Small payload (512 bytes)</td><td>Degrades to queued check-ins</td><td>Only vectors leave device</td><td>Central gallery, easy audit</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Capture and environment</h3>
<ul>
  <li><strong>Backlight</strong> (glass entrance behind the user): face becomes a silhouette. Fix the install first (angle, fill light), then CLAHE / exposure compensation targeted on the face region.</li>
  <li><strong>Mirroring:</strong> front-camera previews are mirrored for the user; make sure the frame you analyse is not double-flipped or you will enrol mirrored templates (most embedders are not flip-invariant enough to ignore it).</li>
  <li><strong>Rotation:</strong> Android frames arrive in sensor orientation; skipping <code>rotationDegrees</code> means the detector sees sideways faces and silently finds nothing.</li>
  <li><strong>Motion blur</strong> as people walk up: gate on sharpness and use the <em>best</em> frame of a short burst rather than the first.</li>
  <li><strong>Tablet height:</strong> a device mounted for average height gives tall users a steep pitch; gate on head-pose angles and prompt "look at the screen".</li>
</ul>

<h3>People</h3>
<ul>
  <li><strong>Twins / family members:</strong> embedding models genuinely struggle; the margin rule plus a secondary factor is the honest answer.</li>
  <li><strong>Appearance change:</strong> beards, glasses, masks, ageing. Keep multiple templates per person and consider <em>controlled</em> template update: add a new template only after a high-confidence match (well above threshold) — never on a borderline one, or an impostor can poison the gallery.</li>
  <li><strong>Demographic performance gaps:</strong> accuracy can vary by skin tone, age and gender depending on training data. Measure FRR per group on your pilot data; it is both an ethics and a product-quality issue.</li>
  <li><strong>Non-enrolled visitor</strong> walks up: 1:N must return "unknown", not the nearest employee. That is exactly what the threshold + margin enforce.</li>
</ul>

<h3>System</h3>
<ul>
  <li><strong>Model upgrade invalidates every template.</strong> Embeddings from model v1 and v2 live in different spaces; comparing them is meaningless. Store the model version with each template and re-embed from retained enrolment images (if policy allows keeping them) or re-enrol.</li>
  <li><strong>Normalisation mismatch</strong> between enrolment path and match path (one does RGB, one BGR; one aligns, one crops) — scores look "a bit low" for everyone. Share one pre-processing function.</li>
  <li><strong>Clock and offline:</strong> on-device attendance written offline must carry device time + monotonic sequence, and the server must handle late, duplicated syncs idempotently.</li>
  <li><strong>Duplicate check-ins:</strong> a person standing in front of the kiosk is matched 30 times a second; debounce per person (e.g. one event per N minutes).</li>
  <li><strong>Device integrity:</strong> on a rooted device templates and the decision can be tampered with; sign events and treat the kiosk as semi-trusted.</li>
</ul>
<div class="callout danger">
  <div class="callout-title">Legal edge</div>
  <p>Biometric data is "special category" data under GDPR and is regulated by specific laws elsewhere (e.g. Illinois BIPA in the US; India's DPDP Act treats it as personal data requiring consent). Get explicit consent, offer a non-biometric alternative, define retention, and delete templates when someone leaves. Check current law for the deployment country — this is not legal advice.</p>
</div>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<table>
  <thead><tr><th>Bug / anti-pattern</th><th>Symptom</th><th>Fix</th></tr></thead>
  <tbody>
    <tr><td>Feeding BGR to an RGB-trained model</td><td>Accuracy a few points lower "for no reason"</td><td><code>cvtColor</code> or <code>swapRB=True</code>; write a test with a known image + expected embedding</td></tr>
    <tr><td><code>cv2.resize(img, (h, w))</code></td><td>Squashed faces, wrong boxes</td><td>OpenCV sizes are (width, height)</td></tr>
    <tr><td>Not calling <code>setInputSize</code> on YuNet for each new frame size</td><td>Boxes offset or no detections</td><td>Set it whenever the input dimensions change</td></tr>
    <tr><td>Skipping alignment ("the crop looks fine")</td><td>Higher FRR, worse at tilted heads</td><td>Similarity-transform to the template the model was trained with</td></tr>
    <tr><td>Using a threshold from a paper/README</td><td>Either lots of false rejects or silent false accepts</td><td>Calibrate on your own genuine/impostor pairs; re-check after camera/model change</td></tr>
    <tr><td>Max over all templates, then second-best over templates (not people)</td><td>Margin is always ~0 for users with many templates → endless retries</td><td>Aggregate per person first</td></tr>
    <tr><td>Auto-adding templates on every match</td><td>Gallery drift; impostor poisoning</td><td>Only on high-confidence matches, cap per person, audit</td></tr>
    <tr><td>Storing raw face photos "just in case"</td><td>Privacy liability, breach impact</td><td>Store embeddings + minimal enrolment images only if policy needs them, encrypted</td></tr>
    <tr><td>Processing every frame on Android with a queue</td><td>Latency grows to seconds, memory climbs</td><td><code>KEEP_ONLY_LATEST</code>, close every <code>ImageProxy</code></td></tr>
    <tr><td>Sending frames across the RN bridge as base64</td><td>Single-digit fps, jank</td><td>Process natively (frame processor / native module), send only results to JS</td></tr>
    <tr><td>Treating detection score as identity confidence</td><td>"0.98 confident it's Alice"</td><td>Detection score = "is a face"; identity comes from the embedding similarity</td></tr>
    <tr><td>Recognition without liveness on an unattended kiosk</td><td>Photo-on-phone attendance fraud</td><td>Add PAD (passive model and/or challenge) + audit snapshots under policy</td></tr>
    <tr><td>Using <code>findContours</code> result unpacking from OpenCV 3 tutorials</td><td><code>ValueError: not enough values to unpack</code></td><td>OpenCV 4 returns 2 values</td></tr>
  </tbody>
</table>
<div class="callout warn">
  <div class="callout-title">The quiet one</div>
  <p>Enrolment done on a phone camera, matching done on the kiosk camera. Different sensor, lens and white balance shift the genuine-score distribution down. Enrol on the same device type you match on, or calibrate the threshold on cross-device pairs.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. How is an image represented in OpenCV, and what are the two gotchas?</div>
  <div class="qa-answer">
    <p>A NumPy array of shape (H, W, C), usually <code>uint8</code>. Gotcha one: channel order is BGR, so convert before feeding RGB-trained models. Gotcha two: array indexing is <code>[y, x]</code> (row, column) while OpenCV functions take points as (x, y) and sizes as (width, height).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Walk me through a face-recognition pipeline.</div>
  <div class="qa-answer">
    <p>Detect the face and 5 landmarks (YuNet / ML Kit / RetinaFace-class model), quality-gate (size, blur, pose, single face), liveness check, align to a canonical crop with a similarity transform, run an embedding network (ArcFace/SFace/MobileFaceNet) to get a 128–512-d vector, L2-normalise, then compare with cosine similarity to enrolled templates. Decide with a calibrated threshold, plus a margin rule for 1:N and a grey zone that triggers retry or fallback.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Why not just train a classifier with one class per employee?</div>
  <div class="qa-answer">
    <p>Because every new hire would require retraining, you have only a handful of photos per person, and a classifier has no "unknown" class — it will always pick someone. Metric learning (embeddings) generalises to people never seen in training: enrolment is just storing a vector, and "unknown" is simply "nothing above threshold".</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do you choose the match threshold?</div>
  <div class="qa-answer">
    <p>Collect genuine and impostor pairs from the real deployment (same camera, lighting, population), compute the score distributions, and plot FAR vs FRR. The business sets the acceptable FAR (attendance fraud vs a door lock are different), then you pick the lowest threshold meeting it and report the resulting FRR with confidence intervals. Re-calibrate whenever the model, camera or population changes.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. 1:1 vs 1:N — why does N matter?</div>
  <div class="qa-answer">
    <p>In 1:N each query is compared against N people, so the probability that at least one impostor exceeds the threshold grows roughly with N times the per-comparison FAR. A threshold that's safe for 1:1 can be unsafe for 5,000 employees. Mitigations: a stricter threshold, a margin over the second-best person, or turning it into 1:1 by adding a claim (badge, employee code).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How does liveness detection work and how do you evaluate it?</div>
  <div class="qa-answer">
    <p>Passive: a CNN classifies live vs attack from texture cues (print grain, moiré, screen reflections, borders). Active: challenge-response — blink, turn, smile — verified via landmark motion across frames. Hardware: depth or NIR cameras. Evaluate it separately from recognition with APCER (attacks accepted) and BPCER (real users rejected) per ISO/IEC 30107-3, using an attack set that matches realistic threats (printed photos, phone replays, maybe masks).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Classical CV or deep learning for detecting a document's edges in a scanning app?</div>
  <div class="qa-answer">
    <p>Start classical: grayscale → blur → Canny → contours → largest 4-point polygon → perspective warp. It's fast, explainable and needs no data. Move to a learned edge/corner model only when backgrounds are cluttered or contrast is low and you have measured the classical failure rate. Often the best production answer is classical with a learned fallback.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How would you run this on an Android tablet at 30 fps?</div>
  <div class="qa-answer">
    <p>You don't need recognition at 30 fps — you need responsive detection and one good recognition. CameraX ImageAnalysis with keep-only-latest backpressure; ML Kit fast-mode detection every frame for UI guidance; when a single sharp, frontal face is stable for a few frames, run liveness and a quantised TFLite embedding once; cache the result and debounce. Use GPU/NNAPI delegates where supported, keep models small (int8), and always close frames so the pipeline never stalls.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. You upgrade the embedding model. What breaks?</div>
  <div class="qa-answer">
    <p>Every stored template — v1 and v2 embeddings live in different vector spaces, so cross-version similarities are noise. Plan it like a schema migration: version each template, re-embed from retained enrolment images (if policy allows), dual-run old and new models during migration (match with the version the template was made with), and re-calibrate thresholds for the new model before cutting over.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. FDE scenario: the customer says "the kiosk doesn't recognise people in the morning". What do you do?</div>
  <div class="qa-answer">
    <p>Get data before theories: pull the logged scores and quality reasons (no_face / blurry / grey zone) by hour of day. "Morning only" strongly suggests lighting — low sun through the entrance creates backlight. Confirm with a few consented frames or a site photo. Fixes in order of cost: re-angle the tablet or add a fill light; face-region exposure/CLAHE; enrol a template under morning conditions; only then consider threshold changes (and never lower it blindly — that buys recall with false accepts). Report back with before/after FRR by hour.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Where should matching happen: device or server?</div>
  <div class="qa-answer">
    <p>Device: lowest latency, works offline, but templates must be synced, encrypted and wiped, and model updates ride app releases. Server: central audit, easy upgrades, no gallery on devices, but adds network latency and dependency. A common middle path: embed on device, send only the vector (a few hundred bytes) to the server for matching, with an offline queue. Pick based on offline requirements, headcount, privacy stance and how often the model changes.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How would you test a CV pipeline in CI?</div>
  <div class="qa-answer">
    <p>Golden-image unit tests for pre-processing (colour order, resize, alignment output matches a stored array within tolerance); a frozen evaluation set run on every model or pipeline change with FAR/FRR and per-group metrics as gates; performance tests on representative hardware (latency p50/p95). Treat the threshold and model version as config with change control.</p>
  </div>
</div>
` },

  ]
});
