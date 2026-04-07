const menuToggle = document.querySelector("[data-menu-toggle]");
const siteNav = document.querySelector("[data-site-nav]");
const header = document.querySelector("[data-site-header]");
const root = document.documentElement;
const heroSection = document.querySelector("#top");
const heroSurfaceRoot = document.querySelector("[data-hero-surface]");
const heroOrbCanvas = document.querySelector("[data-hero-orb]");
const heroOrbImage = document.querySelector("[data-hero-orb-image]");
const thermalDividerRoot = document.querySelector("[data-thermal-divider]");
const collectiveSurfaceRoot = document.querySelector("[data-collective-surface]");
const contactContoursRoot = document.querySelector(".contact__contours");
const impactVideo = document.querySelector(".impact__video");
const lumaSection = document.querySelector("[data-luma-section]");
const lumaLoopVideo = document.querySelector("[data-luma-video-loop]");
const collectivePortraitImage = document.querySelector("[data-collective-portrait-image]");
const collectivePortraitMask = document.querySelector(".portrait-mask");
const parallaxItems = document.querySelectorAll("[data-parallax]");
const contactForm = document.querySelector("[data-contact-form]");
const formNote = document.querySelector("[data-form-note]");
const contactChooser = document.querySelector("[data-contact-chooser]");
const contactChallengePrompt = document.querySelector("[data-contact-challenge-prompt]");
const contactOptions = document.querySelector("[data-contact-options]");
const contactEmailLink = document.querySelector("[data-contact-email-link]");
const composeButtons = document.querySelectorAll("[data-compose-target]");
const contactSubmitButton = document.querySelector("[data-contact-submit]");
const contactHoneypotField = contactForm?.elements?.website ?? null;
const beliefSection = document.querySelector("[data-belief-section]");
const impactSection = document.querySelector("[data-impact-section]");
const accordionItems = document.querySelectorAll(".accordion-item");
const MIN_CONTACT_FILL_TIME_MS = 4000;
const CONTACT_EMAIL_CODES = [
  97, 110, 116, 104, 111, 110, 121, 46, 97, 115, 117, 101, 103, 97, 64, 99, 111,
  108, 108, 101, 99, 116, 105, 118, 101, 99, 108, 105, 109, 97, 116, 101, 46, 111,
  114, 103,
];

const contactState = {
  startedAt: Date.now(),
  challengeA: null,
  challengeB: null,
};

const createViewportActivityTracker = (element, options = {}) => {
  if (!element) {
    return () => false;
  }

  let isIntersecting = true;
  const observer = new IntersectionObserver(
    ([entry]) => {
      isIntersecting = Boolean(entry?.isIntersecting);
    },
    {
      threshold: options.threshold ?? 0,
      rootMargin: options.rootMargin ?? "160px 0px 160px 0px",
    }
  );

  observer.observe(element);
  return () => isIntersecting && !document.hidden;
};

// Hero surface controls for the DOM/CSS blob renderer.
// This replaces the older canvas-based surface approach.
//
// Gradient controls:
// - `gradientStops` are the radial-gradient color stops for the full field.
//   Lighter/brighter stops make the hero feel foggier. Darker stops make it moodier.
//
// Blob controls:
// - `blobColors` cycles through blob fill colors.
//   These can be `rgba(...)`, `rgb(...)`, `hsl(...)`, hex, or any other valid CSS color.
// - `density` controls how many blobs are rendered. Larger = busier/more layered.
// - `speed` is the base animation duration in seconds. Larger = slower movement.
// - `blur` is the base blur radius in px. Larger = softer, meltier blobs.
// - `sizeMin` / `sizeMax` set the blob diameter range in px.
// - `opacityMin` / `opacityMax` set how visible the blobs can be.
// - `driftX` / `driftY` set max travel range in percent. Larger = more motion.
// - `spreadTop` / `spreadLeft` control the area blobs can spawn within.
// - `scaleMin` / `scaleMax` control base blob scale.
// - `speedStart` sets the initial blob velocity. Larger = blobs begin moving faster.
// - `speedMax` sets the top speed cap. Larger = blobs are allowed to move faster.
//
// Texture controls:
// - `noiseOpacity` controls the visibility of the grain overlay.
// - `noiseStripe` and `noiseFill` control the grain colors.
const HERO_SURFACE_CONTROLS = {
  gradientStops: [
    "rgba(154, 170, 154, 0.62) 0%",
    "rgba(110, 122, 115, 0.38) 34%",
    "rgba(21, 25, 25, 0.08) 100%",
  ],
  blobColors: [
    "rgba(188, 174, 148, 0.24)",
    "rgba(229, 223, 212, 0.18)",
    "rgba(24, 26, 24, 0.64)",
    "rgba(86, 131, 63, 0.12)",
  ],
  density: 28,
  speed: 25,
  blur: 30,
  sizeMin: 160,
  sizeMax: 560,
  opacityMin: 0.44,
  opacityMax: 0.82,
  driftX: 82,
  driftY: 64,
  spreadTop: 78,
  spreadLeft: 78,
  scaleMin: 0.84,
  scaleMax: 1.46,
  speedStart: 3,
  speedMax: 6,
  noiseOpacity: "0.64",
  noiseStripe: "hsl(33 18% 90% / 0.035)",
  noiseFill: "hsl(33 18% 90% / 0.018)",
};

const THERMAL_DIVIDER_CONTROLS = {
  minPocketCount: 5,
  maxPocketCount: 9,
  sizeMin: 80,
  sizeMax: 260,
  stretchMin: 2.2,
  stretchMax: 4.8,
  driftSpeedMin: 0.02,
  driftSpeedMax: 0.1,
  pulseSpeedMin: 0.1,
  pulseSpeedMax: 0.2,
  presenceSpeedMin: 0.08,
  presenceSpeedMax: 0.22,
  blurCore: 30,
  blurHalo: 60,
  coreOpacity: 0.8,
  haloOpacity: 0.64,
  grainDots: 2000,
  grainOpacity: 0.26,
};

// Contact contour controls for the concentric-ring field in "Let's Work Together."
//
// Color controls:
// - `fieldGlowPrimary` / `fieldGlowSecondary` are the soft ambient glows behind the rings.
//   Increase alpha to make the whole section feel more luminous.
// - `ringColorPrimary` / `ringColorSecondary` are the actual ring colors.
//   Use any valid CSS color string.
//
// Ring styling:
// - `ringWidth`: thickness of each ring band in px. Larger = chunkier rings.
// - `ringGap`: space between ring bands in px. Larger = fewer, more open circles.
// - `ringOpacityPrimary` / `ringOpacitySecondary`: overall visibility of each ring layer.
// - `blurPrimary` / `blurSecondary`: softens the rings. Larger = hazier/less crisp.
// - `centerX` / `centerY`: center point of the ring system in % of the section.
//   Larger `centerX` moves the circles right. Smaller `centerY` moves them upward.
//
// Motion:
// - `speedPrimary` / `speedSecondary`: full back-and-forth duration in seconds.
//   Larger = slower motion.
// - `travelXPrimary` / `travelYPrimary`: how far the primary layer moves in %.
//   Larger = wider pendulum swing.
// - `travelXSecondary` / `travelYSecondary`: same for the second layer.
// - `rotationPrimary` / `rotationSecondary`: max tilt in degrees.
// - `scalePrimary` / `scaleSecondary`: how much each layer swells at the outer end of travel.
// - `syncLayers`: when `true`, the second layer uses the same phase as the first layer.
//   This keeps both ring systems moving in lockstep.
//
// Overlap hold:
// - `overlapPausePrimary` / `overlapPauseSecondary`: time spent paused while layers overlap
//   near the center, expressed as a fraction of half a cycle.
//   `0` = no hold. Around `0.12` to `0.22` gives a noticeable pause.
const CONTACT_CONTOUR_CONTROLS = {
  fieldGlowPrimary: "rgba(128, 164, 101, 0)",
  fieldGlowSecondary: "rgba(12, 12, 12, 0)",
  ringColorPrimary: "rgba(73, 151, 24, 0.98)",
  ringColorSecondary: "rgba(8, 8, 8, 0.88)",
  ringWidth: 4,
  ringGap: 24,
  ringOpacityPrimary: 0.015,
  ringOpacitySecondary: 0.015,
  blurPrimary: 0,
  blurSecondary: 0,
  centerX: 76,
  centerY: 28,
  syncLayers: false,
  speedPrimary: 40,
  speedSecondary: 40,
  travelXPrimary: 2.6,
  travelYPrimary: 1.2,
  travelXSecondary: 2.6,
  travelYSecondary: 1.2,
  rotationPrimary: 2.6,
  rotationSecondary: 2.6,
  scalePrimary: 1.06,
  scaleSecondary: 1.06,
  overlapPausePrimary: 0.3,
  overlapPauseSecondary: 0.3,
};

// Sea-turtle video color controls for the "Mother Earth Needs Us." section.
//
// Duotone controls:
// - `duotoneEnabled`: toggles the two-tone treatment on/off.
// - `shadowTone`: color used for darker parts of the image.
// - `highlightTone`: color used for lighter parts of the image.
// - `shadowOpacity`: strength of the dark tone. Larger = moodier/deeper greens.
// - `highlightOpacity`: strength of the light tone. Larger = more off-white lift.
//
// Base video grading:
// - `grayscale`: `1` is full grayscale before tinting. Higher color removal helps duotone read cleanly.
// - `brightness`: larger = brighter video.
// - `contrast`: larger = punchier highlights/shadows.
// - `saturation`: larger = more original color preserved. Lower = more graphic/duotone.
// - `hueRotate`: degrees of hue shift before the duotone overlays.
const IMPACT_VIDEO_CONTROLS = {
  duotoneEnabled: true,
  shadowTone: "rgba(58, 82, 63, 1)",
  highlightTone: "rgb(128, 150, 191)",
  shadowOpacity: 0.76,
  highlightOpacity: 0.34,
  grayscale: .5,
  brightness: .78,
  contrast: 1.28,
  saturation: .42,
  hueRotate: 1002,
};

// Collective portrait duotone controls.
//
// Base look:
// - `shadowOpacityMax`: maximum green shadow overlay away from center.
// - `highlightOpacityMax`: maximum off-white highlight overlay away from center.
// - `grayscaleMax`: maximum grayscale amount away from center.
// - `saturationBase`: saturation when the portrait is centered in view.
// - `saturationBoost`: extra saturation added as duotone returns.
// - `contrastBase` / `contrastBoost`: portrait contrast at center and edge.
// - `brightnessBase` / `brightnessDrop`: portrait brightness at center and edge.
// - `hueShiftMax`: maximum hue rotation away from center.
//
// Scroll response:
// - `focusBand`: how much of the viewport counts as the “natural color” zone.
//   Larger = longer full-color window around center.
const COLLECTIVE_PORTRAIT_DUOTONE_CONTROLS = {
  shadowOpacityMax: 0.52,
  highlightOpacityMax: 0.3,
  grayscaleMax: 0.28,
  saturationBase: 1.15,
  saturationBoost: 0,
  contrastBase: 1.16,
  contrastBoost: 0,
  brightnessBase: 0.9,
  brightnessDrop: 0,
  hueShiftMax: 10,
  focusBand: 0.68,
};

// Hero globe controls for the center mark.
// These tune the translucent liquid-glass treatment around the center mark.
//
// Globe controls:
// - `rotation`: base angle of the strongest moving surface highlight.
// - `speed`: overall liquid-motion speed. Larger values animate faster.
// - `intensity`: brightness of the internal highlight. Larger values make the glass effect stronger.
// - `scale`: spread of the liquid field across the globe. Larger values make the distortion broader.
// - `shadow`: size of the outer glow/halo. Larger values create more surrounding bloom.
// - `smoothness`: softness of the highlight edges. Larger values make the surface silkier.
// - `morphSpeed`: rate of internal liquid movement. Larger values make the globe feel more active.
//
// Practical controls:
// - `particleCount`: number of tiny interior specks. Larger values make the globe busier.
// - `particleDrift`: how far those specks drift inside the globe.
// - `particleSize`: size of the specks.
// - `particleOpacity`: visibility of the interior specks. Larger values make them easier to see.
// - `glowOpacity`: strength of the outer halo. Larger values make the outside glow brighter.
// - `sweepWidth`: width of the moving highlight band.
// - `globeSize`: the single overall size control for the globe/logo render.
//   Larger values make the whole globe appear bigger. Smaller values add more empty space around it.
// - `logoScale`: size of the logo inside the globe relative to the globe itself.
//   Smaller values shrink the logo while keeping the globe the same size.
// - `shadow`: halo spread around the globe. Larger values make the outside glow extend farther.
// - `globeGlowColor` sets the bright inner halo color.
// - `globeGlowSoftColor` sets the softer outer halo color.
// - `globeCoreColor`, `globeFillColor`, `globeHighlightColor`, and `globeRimColor`
//   set the main visible globe body and highlight colors.
// - `warpDepth` controls how strongly the logo is wrapped like a sphere.
// - `warpSlices` controls how many strips are used for the wrap. Larger = smoother warp.
// - `sphereCurve` controls how strongly strips follow the sphere silhouette.
// - `logoOpacity` controls how visible the wrapped logo is through the globe.
// - `logoBaseOpacity` adds a subtle centered logo underlay so the mark remains readable.
const HERO_BURN_CONTROLS = {
  rotation: 220,

  // Overall motion speed of the liquid surface. Larger = faster.
  speed: 46,

  // Strength of the translucent internal highlight.
  intensity: .01,

  // Spread of the liquid field across the globe.
  scale: 5.28,

  // Halo radius around the globe.
  shadow: 0,

  // Softness of the liquid highlight edges.
  smoothness: 10,

  // Internal liquid motion speed.
  morphSpeed: 1.6,

  // Number of tiny floating interior specks.
  particleCount: 20,

  // How far specks drift from their anchor positions.
  particleDrift: .2,

  // Overall speck size.
  particleSize: 0.5,

  // Visibility of the interior specks.
  particleOpacity: 0.15,

  // Ambient halo strength around the globe.
  glowOpacity: 0,

  // Width of the moving liquid highlight band.
  sweepWidth: 20,

  // Single overall size control for the globe/logo render.
  globeSize: 1.8,

  // Size of the logo inside the globe relative to the globe itself.
  logoScale: 0.8,

  // Main halo color around the globe.
  globeGlowColor: "rgba(177, 235, 19, 0.52)",

  // Softer secondary glow color.
  globeGlowSoftColor: "rgba(181, 175, 174, 0.59)",

  // Brightest central globe highlight.
  globeCoreColor: "rgba(75, 100, 69, 0.7)",

  // Mid-tone translucent globe fill.
  globeFillColor: "rgba(134, 133, 78, 0.81)",

  // Moving liquid highlight color.
  globeHighlightColor: "rgba(244, 248, 233, 0.57)",

  // Outer rim-light color.
  globeRimColor: "rgba(245, 247, 238, 0.45)",

  // How strongly the logo bends around the sphere. Larger = more 3D wrap.
  warpDepth: 0.72,

  // Number of strips used to warp the logo. Larger = smoother sphere mapping.
  warpSlices: 0,

  // How strongly the logo follows the ball silhouette. Larger = more globe-like wrap.
  sphereCurve: 0,

  // Overall visibility of the wrapped logo texture.
  logoOpacity: .9,

  // Visibility of the non-warped underlay logo.
  // Higher values make the mark easier to read, but they also hide the spherical warp.
  logoBaseOpacity: .9,
};

const applyHeroSurfaceControls = (controls) => {
  if (!root) {
    return;
  }

  root.style.setProperty("--hero-gradient-stops", controls.gradientStops.join(", "));
  root.style.setProperty("--hero-blob-noise-opacity", controls.noiseOpacity);
  root.style.setProperty("--hero-blob-noise-stripe", controls.noiseStripe);
  root.style.setProperty("--hero-blob-noise-fill", controls.noiseFill);
};

applyHeroSurfaceControls(HERO_SURFACE_CONTROLS);

const applyHeroGlobeControls = (controls) => {
  if (!heroOrbCanvas) {
    return;
  }

  const heroOrb = heroOrbCanvas.closest(".hero__orb");
  if (!heroOrb) {
    return;
  }

  heroOrb.style.setProperty("--hero-orb-size-multiplier", Math.max(0.35, controls.globeSize).toString());
};

applyHeroGlobeControls(HERO_BURN_CONTROLS);

const applyImpactVideoControls = (video, controls) => {
  if (!video || !root) {
    return;
  }

  root.style.setProperty("--impact-video-shadow-tone", controls.shadowTone);
  root.style.setProperty("--impact-video-highlight-tone", controls.highlightTone);
  root.style.setProperty("--impact-video-shadow-opacity", controls.shadowOpacity.toString());
  root.style.setProperty("--impact-video-highlight-opacity", controls.highlightOpacity.toString());
  root.style.setProperty("--impact-video-duotone-enabled", controls.duotoneEnabled ? "1" : "0");
  video.style.filter = `grayscale(${controls.grayscale}) brightness(${controls.brightness}) contrast(${controls.contrast}) saturate(${controls.saturation}) hue-rotate(${controls.hueRotate}deg)`;
};

const applyContactContourControls = (surfaceRoot, controls) => {
  if (!surfaceRoot) {
    return;
  }

  surfaceRoot.style.setProperty("--contact-field-glow-primary", controls.fieldGlowPrimary);
  surfaceRoot.style.setProperty("--contact-field-glow-secondary", controls.fieldGlowSecondary);
};

const updateCollectivePortraitTone = () => {
  if (!collectivePortraitImage || !collectivePortraitMask) {
    return;
  }

  const controls = COLLECTIVE_PORTRAIT_DUOTONE_CONTROLS;
  collectivePortraitMask.style.setProperty("--portrait-grayscale", controls.grayscaleMax.toFixed(3));
  collectivePortraitMask.style.setProperty("--portrait-saturation", controls.saturationBase.toFixed(3));
  collectivePortraitMask.style.setProperty("--portrait-contrast", controls.contrastBase.toFixed(3));
  collectivePortraitMask.style.setProperty("--portrait-brightness", controls.brightnessBase.toFixed(3));
  collectivePortraitMask.style.setProperty("--portrait-hue", `${controls.hueShiftMax.toFixed(2)}deg`);
  collectivePortraitMask.style.setProperty("--portrait-shadow-opacity", controls.shadowOpacityMax.toFixed(3));
  collectivePortraitMask.style.setProperty("--portrait-highlight-opacity", controls.highlightOpacityMax.toFixed(3));
};

const ensureLiquidGlassFilter = () => {
  if (typeof document === "undefined" || document.getElementById("collective-liquid-glass-filter")) {
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.id = "collective-liquid-glass-filter";
  wrapper.setAttribute("aria-hidden", "true");
  wrapper.style.position = "absolute";
  wrapper.style.width = "0";
  wrapper.style.height = "0";
  wrapper.style.overflow = "hidden";
  wrapper.innerHTML = `
    <svg aria-hidden="true" style="position:absolute;width:0;height:0">
      <filter id="collectiveLiquidDisplacement">
        <feTurbulence type="turbulence" baseFrequency="0.016" numOctaves="2" result="turbulence" />
        <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="118" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  `;
  document.body.appendChild(wrapper);
};

const initializeContactContours = (surfaceRoot, controls) => {
  if (!surfaceRoot) {
    return;
  }

  applyContactContourControls(surfaceRoot, controls);
  surfaceRoot.replaceChildren();

  const createLayer = (className, color, width, gap, opacity, blur) => {
    const layer = document.createElement("div");
    layer.className = `contact__contour-layer ${className}`;
    layer.style.setProperty("--contact-ring-color", color);
    layer.style.setProperty("--contact-ring-width", `${width}px`);
    layer.style.setProperty("--contact-ring-gap", `${gap}px`);
    layer.style.setProperty("--contact-ring-opacity", opacity.toString());
    layer.style.setProperty("--contact-ring-blur", `${blur}px`);
    layer.style.setProperty("--contact-ring-center-x", `${controls.centerX}%`);
    layer.style.setProperty("--contact-ring-center-y", `${controls.centerY}%`);
    return layer;
  };

  const primaryLayer = createLayer(
    "contact__contour-layer--primary",
    controls.ringColorPrimary,
    controls.ringWidth,
    controls.ringGap,
    controls.ringOpacityPrimary,
    controls.blurPrimary
  );
  const secondaryLayer = createLayer(
    "contact__contour-layer--secondary",
    controls.ringColorSecondary,
    controls.ringWidth,
    controls.ringGap,
    controls.ringOpacitySecondary,
    controls.blurSecondary
  );

  surfaceRoot.append(primaryLayer, secondaryLayer);

  const pendulumPhase = (timeSeconds, durationSeconds, holdRatio) => {
    const safeDuration = Math.max(durationSeconds, 0.01);
    const halfProgress = (timeSeconds / safeDuration) * 2;
    const halfIndex = Math.floor(halfProgress) % 2;
    const t = halfProgress - Math.floor(halfProgress);
    const hold = Math.min(Math.max(holdRatio, 0), 0.45);
    const moveSegment = Math.max((1 - hold) / 2, 0.001);

    let value;
    if (t < moveSegment) {
      value = -1 + (t / moveSegment);
    } else if (t < moveSegment + hold) {
      value = 0;
    } else {
      value = (t - moveSegment - hold) / moveSegment;
    }

    return halfIndex === 0 ? value : -value;
  };

  const animate = (time) => {
    const timeSeconds = time / 1000;

    const primaryPhase = pendulumPhase(
      timeSeconds,
      controls.speedPrimary,
      controls.overlapPausePrimary
    );
    const secondaryPhase = controls.syncLayers
      ? primaryPhase
      : -pendulumPhase(
          timeSeconds,
          controls.speedSecondary,
          controls.overlapPauseSecondary
        );

    primaryLayer.style.transform = `translate3d(${(primaryPhase * controls.travelXPrimary).toFixed(3)}%, ${(primaryPhase * controls.travelYPrimary).toFixed(3)}%, 0) rotate(${(primaryPhase * controls.rotationPrimary).toFixed(3)}deg) scale(${(1 + Math.abs(primaryPhase) * (controls.scalePrimary - 1)).toFixed(4)})`;
    secondaryLayer.style.transform = `translate3d(${(secondaryPhase * controls.travelXSecondary).toFixed(3)}%, ${(secondaryPhase * controls.travelYSecondary).toFixed(3)}%, 0) rotate(${(secondaryPhase * controls.rotationSecondary).toFixed(3)}deg) scale(${(1 + Math.abs(secondaryPhase) * (controls.scaleSecondary - 1)).toFixed(4)})`;

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
};

const initializeHeroSurface = (surfaceRoot, controls) => {
  if (!surfaceRoot) {
    return;
  }

  const noise = (seed) => {
    const value = Math.sin(seed) * 10000;
    return value - Math.floor(value);
  };

  surfaceRoot.replaceChildren();

  const gradient = document.createElement("div");
  gradient.className = "hero__surface-gradient";
  surfaceRoot.appendChild(gradient);

  const blobStates = [];

  for (let index = 0; index < controls.density; index += 1) {
    const seed = index + 1;
    const blob = document.createElement("div");
    const top = 5 + noise(seed) * controls.spreadTop;
    const left = 5 + noise(seed + 1) * controls.spreadLeft;
    const size = controls.sizeMin + noise(seed + 2) * (controls.sizeMax - controls.sizeMin);
    const startX = noise(seed + 3) * controls.driftX - controls.driftX / 2;
    const startY = noise(seed + 4) * controls.driftY - controls.driftY / 2;
    const driftX = noise(seed + 5) * controls.driftX - controls.driftX / 2;
    const driftY = noise(seed + 6) * controls.driftY - controls.driftY / 2;
    const duration = controls.speed * (0.7 + noise(seed + 7) * 1.3);
    const delay = noise(seed + 8) * duration;
    const blurAmount = controls.blur * (0.7 + noise(seed + 9) * 0.8);
    const opacity = controls.opacityMin + noise(seed + 10) * (controls.opacityMax - controls.opacityMin);
    const scale = controls.scaleMin + noise(seed + 11) * (controls.scaleMax - controls.scaleMin);

    blob.className = "hero__surface-blob";
    blob.style.background = controls.blobColors[index % controls.blobColors.length];
    blob.style.top = `${top}%`;
    blob.style.left = `${left}%`;
    blob.style.width = `${size}px`;
    blob.style.height = `${size}px`;
    blob.style.setProperty("--blob-blur", `${blurAmount}px`);
    blob.style.setProperty("--blob-scale", scale.toString());
    blob.style.setProperty("--blob-opacity", opacity.toString());
    blob.style.setProperty("--start-x", `${startX}%`);
    blob.style.setProperty("--start-y", `${startY}%`);
    blob.style.setProperty("--drift-x", `${driftX}%`);
    blob.style.setProperty("--drift-y", `${driftY}%`);
    surfaceRoot.appendChild(blob);

    blobStates.push({
      element: blob,
      topPercent: top,
      leftPercent: left,
      scale,
      wobble: noise(seed + 12) * Math.PI * 2,
      size,
      posX: 0,
      posY: 0,
      velX: 0,
      velY: 0,
      wander: noise(seed + 13) * Math.PI * 2,
      speedFactor: 0.7 + noise(seed + 14) * 1.3,
      driftBiasX: driftX,
      driftBiasY: driftY,
    });
  }

  const vignette = document.createElement("div");
  vignette.className = "hero__surface-vignette";
  surfaceRoot.appendChild(vignette);

  const resetBlobLayout = () => {
    const width = surfaceRoot.clientWidth;
    const height = surfaceRoot.clientHeight;

    blobStates.forEach((blob, index) => {
      blob.posX = (blob.leftPercent / 100) * width;
      blob.posY = (blob.topPercent / 100) * height;

      const direction = noise(index + 21) * Math.PI * 2;
      const baseSpeed = controls.speedStart * blob.speedFactor;
      blob.velX = Math.cos(direction) * baseSpeed + blob.driftBiasX * 0.02;
      blob.velY = Math.sin(direction) * baseSpeed + blob.driftBiasY * 0.02;
    });
  };

  resetBlobLayout();
  window.addEventListener("resize", resetBlobLayout);
  const isActive = createViewportActivityTracker(surfaceRoot, { threshold: 0, rootMargin: "200px 0px 200px 0px" });

  let lastTime = 0;
  const animate = (time) => {
    if (!isActive()) {
      lastTime = time;
      requestAnimationFrame(animate);
      return;
    }

    const timeSeconds = time / 1000;
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.033) : 0.016;
    lastTime = time;
    const width = surfaceRoot.clientWidth;
    const height = surfaceRoot.clientHeight;

    blobStates.forEach((blob) => {
      const wobble = Math.sin(timeSeconds * 0.7 + blob.wobble) * 0.08;
      const wanderX = Math.sin(timeSeconds * 0.32 + blob.wander) * 0.9;
      const wanderY = Math.cos(timeSeconds * 0.28 + blob.wander) * 0.9;
      blob.velX += wanderX * dt * 2.4;
      blob.velY += wanderY * dt * 2.4;

      const maxSpeed = controls.speedMax * blob.speedFactor;
      const speed = Math.hypot(blob.velX, blob.velY);
      if (speed > maxSpeed) {
        blob.velX = (blob.velX / speed) * maxSpeed;
        blob.velY = (blob.velY / speed) * maxSpeed;
      }

      blob.posX += blob.velX * dt * 10;
      blob.posY += blob.velY * dt * 10;

      const margin = blob.size * 0.22;
      if (blob.posX < -margin) {
        blob.posX = -margin;
        blob.velX = Math.abs(blob.velX) * 0.98;
      } else if (blob.posX > width - blob.size + margin) {
        blob.posX = width - blob.size + margin;
        blob.velX = -Math.abs(blob.velX) * 0.98;
      }

      if (blob.posY < -margin) {
        blob.posY = -margin;
        blob.velY = Math.abs(blob.velY) * 0.98;
      } else if (blob.posY > height - blob.size + margin) {
        blob.posY = height - blob.size + margin;
        blob.velY = -Math.abs(blob.velY) * 0.98;
      }

      const scale = blob.scale * (1 + wobble);
      blob.element.style.left = `${blob.posX}px`;
      blob.element.style.top = `${blob.posY}px`;
      blob.element.style.transform = `translate3d(0, 0, 0) scale(${scale})`;
    });

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
};

initializeHeroSurface(heroSurfaceRoot, HERO_SURFACE_CONTROLS);
initializeHeroSurface(collectiveSurfaceRoot, HERO_SURFACE_CONTROLS);
initializeContactContours(contactContoursRoot, CONTACT_CONTOUR_CONTROLS);
applyImpactVideoControls(impactVideo, IMPACT_VIDEO_CONTROLS);
ensureLiquidGlassFilter();

const initializeThermalDivider = (surfaceRoot, controls) => {
  if (!surfaceRoot) {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.className = "divider__thermal-canvas";
  surfaceRoot.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const random = (seed) => {
    const value = Math.sin(seed) * 10000;
    return value - Math.floor(value);
  };
  const pocketPoolSize = Math.max(controls.minPocketCount, controls.maxPocketCount);
  const pockets = Array.from({ length: pocketPoolSize }, (_, index) => {
    const seed = index + 1;
    return {
      anchorX: -0.08 + random(seed) * 1.16,
      anchorY: 0.2 + random(seed + 1) * 0.72,
      size: controls.sizeMin + random(seed + 2) * (controls.sizeMax - controls.sizeMin),
      stretch: controls.stretchMin + random(seed + 3) * (controls.stretchMax - controls.stretchMin),
      angle: -0.24 + random(seed + 4) * 0.42,
      driftSpeed: controls.driftSpeedMin + random(seed + 5) * (controls.driftSpeedMax - controls.driftSpeedMin),
      pulseSpeed: controls.pulseSpeedMin + random(seed + 6) * (controls.pulseSpeedMax - controls.pulseSpeedMin),
      presenceSpeed:
        controls.presenceSpeedMin + random(seed + 6.5) * (controls.presenceSpeedMax - controls.presenceSpeedMin),
      phase: random(seed + 7) * Math.PI * 2,
      wobble: random(seed + 8) * Math.PI * 2,
    };
  });

  const resize = () => {
    const { width, height } = surfaceRoot.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  resize();
  window.addEventListener("resize", resize);
  const isActive = createViewportActivityTracker(surfaceRoot, { threshold: 0, rootMargin: "180px 0px 180px 0px" });

  const drawPocket = (width, height, timeSeconds, pocket, presence) => {
    if (presence <= 0.01) {
      return;
    }

    const driftX = Math.sin(timeSeconds * pocket.driftSpeed + pocket.phase) * width * 0.08;
    const driftY = Math.cos(timeSeconds * (pocket.driftSpeed * 0.8) + pocket.wobble) * height * 0.045;
    const pulse = 0.78 + (Math.sin(timeSeconds * pocket.pulseSpeed + pocket.phase) * 0.5 + 0.5) * 0.52;
    const x = pocket.anchorX * width + driftX;
    const y = pocket.anchorY * height + driftY;
    const rx = pocket.size * pocket.stretch * pulse * presence;
    const ry = pocket.size * pulse * presence;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(pocket.angle);

    ctx.filter = `blur(${controls.blurHalo}px)`;
    ctx.globalAlpha = controls.haloOpacity * (0.8 + pulse * 0.25) * presence;
    ctx.fillStyle = "rgba(22, 22, 22, 0.92)";
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.82, ry * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.filter = `blur(${controls.blurCore}px)`;
    ctx.globalAlpha = controls.coreOpacity * (0.72 + pulse * 0.32) * presence;
    ctx.fillStyle = "rgba(255, 251, 245, 0.98)";
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.56, ry * 0.56, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawGrain = (width, height) => {
    ctx.save();
    ctx.globalAlpha = controls.grainOpacity;
    for (let i = 0; i < controls.grainDots; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const shade = 180 + Math.floor(Math.random() * 65);
      const alpha = 0.25 + Math.random() * 0.75;
      const size = Math.random() * 1.4;
      ctx.fillStyle = `rgba(${shade}, ${shade + 6}, ${shade - 8}, ${alpha})`;
      ctx.fillRect(x, y, size, size);
    }
    ctx.restore();
  };

  const render = (time) => {
    if (!isActive()) {
      requestAnimationFrame(render);
      return;
    }

    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const timeSeconds = time / 1000;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.fillStyle = "rgba(146, 156, 142, 0.32)";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    const activePocketTarget =
      controls.minPocketCount +
      ((Math.sin(timeSeconds * 0.11) * 0.5 + 0.5) * (controls.maxPocketCount - controls.minPocketCount));

    pockets.forEach((pocket, index) => {
      const cycle = Math.sin(timeSeconds * pocket.presenceSpeed + pocket.phase) * 0.5 + 0.5;
      const gate = Math.max(0, Math.min(1, activePocketTarget - index));
      const presence = cycle * gate;
      drawPocket(width, height, timeSeconds, pocket, presence);
    });

    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = "rgba(120, 135, 118, 0.44)";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    for (let i = 0; i < Math.max(1, Math.floor(activePocketTarget / 2.4)); i += 1) {
      const pocket = pockets[i];
      const cycle = Math.sin(timeSeconds * pocket.presenceSpeed + pocket.phase) * 0.5 + 0.5;
      drawPocket(
        width,
        height,
        timeSeconds * 0.72 + i,
        {
          ...pocket,
          size: pocket.size * 0.62,
          stretch: pocket.stretch * 0.7,
          angle: pocket.angle * -0.6,
        },
        cycle * 0.72
      );
    }

    drawGrain(width, height);
    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
};

initializeThermalDivider(thermalDividerRoot, THERMAL_DIVIDER_CONTROLS);

const initializeHeroBurn = (canvas, image, controls) => {
  if (!canvas || !image) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const particles = Array.from({ length: controls.particleCount }, (_, index) => ({
    angle: (Math.PI * 2 * index) / Math.max(controls.particleCount, 1),
    radius: 0.18 + Math.random() * controls.particleDrift,
    speed: 0.08 + Math.random() * 0.14,
    size: (0.7 + Math.random() * 1.2) * controls.particleSize,
    wobble: Math.random() * Math.PI * 2,
  }));

  let imageReady = image.complete;

  const withOpacity = (color, alpha) => {
    if (color.startsWith("rgba(")) {
      return color.replace(/rgba\(([^)]+),\s*[\d.]+\)/, `rgba($1, ${alpha})`);
    }
    if (color.startsWith("rgb(")) {
      return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
    }
    return color;
  };

  const resizeCanvas = () => {
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawParticle = (particle, timeSeconds, width, height, ringRadius) => {
    const orbit = particle.angle + timeSeconds * particle.speed;
    const drift = Math.sin(timeSeconds * controls.morphSpeed * 0.35 + particle.wobble) * ringRadius * 0.05;
    const radius = ringRadius * (particle.radius + drift / ringRadius);
    const x = width / 2 + Math.cos(orbit) * radius;
    const y = height / 2 + Math.sin(orbit) * radius;

    ctx.save();
    ctx.fillStyle = `rgba(239, 243, 233, ${controls.particleOpacity})`;
    ctx.beginPath();
    ctx.arc(x, y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const render = (time) => {
    if (!isActive()) {
      requestAnimationFrame(render);
      return;
    }

    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const timeSeconds = time / 1000;
    const renderScale = Math.min(controls.globeSize, 1);
    const ringRadius = Math.min(width, height) * renderScale * 0.5;
    const sweepAngle = ((controls.rotation + timeSeconds * controls.speed * 0.12) * Math.PI) / 180;
    const sweepHalf = (controls.sweepWidth * Math.PI) / 180;
    const morph = 1 + Math.sin(timeSeconds * controls.morphSpeed * 0.45) * (controls.scale * 0.03);

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const haloInnerRadius = ringRadius * 1.04;
    const haloOuterRadius = ringRadius * (1.34 + controls.shadow * 0.03);
    const glow = ctx.createRadialGradient(
      width / 2,
      height / 2,
      haloInnerRadius,
      width / 2,
      height / 2,
      haloOuterRadius
    );
    glow.addColorStop(0, withOpacity(controls.globeGlowColor, 0));
    glow.addColorStop(0.18, withOpacity(controls.globeGlowColor, controls.glowOpacity * 0.9));
    glow.addColorStop(0.48, withOpacity(controls.globeGlowSoftColor, controls.glowOpacity * 0.5));
    glow.addColorStop(0.82, withOpacity(controls.globeGlowSoftColor, controls.glowOpacity * 0.22));
    glow.addColorStop(1, withOpacity(controls.globeGlowSoftColor, 0));
    ctx.filter = `blur(${Math.max(10, controls.shadow * 0.45)}px)`;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, haloOuterRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.filter = "none";

    const corona = ctx.createRadialGradient(
      width / 2,
      height / 2,
      haloInnerRadius,
      width / 2,
      height / 2,
      haloOuterRadius * 0.82
    );
    corona.addColorStop(0, withOpacity(controls.globeGlowColor, 0));
    corona.addColorStop(0.24, withOpacity(controls.globeGlowColor, controls.glowOpacity * 1.15));
    corona.addColorStop(0.62, withOpacity(controls.globeGlowSoftColor, controls.glowOpacity * 0.32));
    corona.addColorStop(1, withOpacity(controls.globeGlowSoftColor, 0));
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, haloOuterRadius * 0.82, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, ringRadius * 0.98, 0, Math.PI * 2);
    ctx.clip();

    const globeFill = ctx.createRadialGradient(
      width / 2 - ringRadius * 0.14,
      height / 2 - ringRadius * 0.2,
      ringRadius * 0.08,
      width / 2,
      height / 2,
      ringRadius
    );
    globeFill.addColorStop(0, withOpacity(controls.globeCoreColor, 0.26));
    globeFill.addColorStop(0.42, withOpacity(controls.globeFillColor, 0.05));
    globeFill.addColorStop(1, withOpacity(controls.globeFillColor, 0));
    ctx.fillStyle = globeFill;
    ctx.fillRect(width / 2 - ringRadius, height / 2 - ringRadius, ringRadius * 2, ringRadius * 2);

    const liquidBand = ctx.createLinearGradient(
      width / 2 + Math.cos(sweepAngle - sweepHalf) * ringRadius,
      height / 2 + Math.sin(sweepAngle - sweepHalf) * ringRadius,
      width / 2 + Math.cos(sweepAngle + sweepHalf) * ringRadius,
      height / 2 + Math.sin(sweepAngle + sweepHalf) * ringRadius
    );
    liquidBand.addColorStop(0, withOpacity(controls.globeHighlightColor, 0));
    liquidBand.addColorStop(0.5, withOpacity(controls.globeHighlightColor, 0.18 + controls.intensity * 0.028));
    liquidBand.addColorStop(1, withOpacity(controls.globeHighlightColor, 0));
    ctx.fillStyle = liquidBand;
    ctx.translate(
      Math.sin(timeSeconds * controls.morphSpeed * 0.55) * controls.scale * 2,
      Math.cos(timeSeconds * controls.morphSpeed * 0.48) * controls.scale * 2
    );
    ctx.rotate(Math.sin(timeSeconds * 0.22) * 0.08);
    ctx.filter = `blur(${Math.max(6, controls.smoothness * 0.08)}px)`;
    ctx.fillRect(-width, -height, width * 2, height * 2);
    ctx.filter = "none";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, ringRadius * 0.98, 0, Math.PI * 2);
    ctx.clip();

    const innerBloom = ctx.createRadialGradient(
      width / 2,
      height / 2,
      ringRadius * 0.08,
      width / 2,
      height / 2,
      ringRadius * 0.88
    );
    innerBloom.addColorStop(0, withOpacity(controls.globeCoreColor, 0.1));
    innerBloom.addColorStop(0.6, withOpacity(controls.globeCoreColor, 0.025));
    innerBloom.addColorStop(1, withOpacity(controls.globeCoreColor, 0));
    ctx.fillStyle = innerBloom;
    ctx.fillRect(width / 2 - ringRadius, height / 2 - ringRadius, ringRadius * 2, ringRadius * 2);

    particles.forEach((particle) => drawParticle(particle, timeSeconds, width, height, ringRadius));
    ctx.restore();

    if (imageReady) {
      const drawSize = Math.min(width, height) * renderScale * controls.logoScale;
      const imageAspect =
        image.naturalWidth && image.naturalHeight
          ? image.naturalWidth / image.naturalHeight
          : image.width / image.height || 1;
      const drawWidth = imageAspect >= 1 ? drawSize : drawSize * imageAspect;
      const drawHeight = imageAspect >= 1 ? drawSize / imageAspect : drawSize;
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, ringRadius * 0.98, 0, Math.PI * 2);
      ctx.clip();
      ctx.translate(width / 2, height / 2);

      const drawRadius = drawSize / 2;
      const edgeDarkness = 0.12;

      ctx.save();
      ctx.globalAlpha = Math.max(controls.logoOpacity, controls.logoBaseOpacity);
      ctx.filter = "contrast(1.18) brightness(0.86)";
      ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      const sphereShade = ctx.createRadialGradient(
        0,
        0,
        drawRadius * 0.1,
        0,
        0,
        drawRadius
      );
      sphereShade.addColorStop(0, "rgba(255, 255, 255, 0)");
      sphereShade.addColorStop(0.68, "rgba(0, 0, 0, 0)");
      sphereShade.addColorStop(1, `rgba(0, 0, 0, ${edgeDarkness})`);
      ctx.fillStyle = sphereShade;
      ctx.beginPath();
      ctx.arc(0, 0, drawRadius * 0.98, 0, Math.PI * 2);
      ctx.fill();

      const frontShade = ctx.createRadialGradient(
        0,
        -drawRadius * 0.18,
        drawRadius * 0.08,
        0,
        0,
        drawRadius
      );
      frontShade.addColorStop(0, "rgba(255, 255, 255, 0.08)");
      frontShade.addColorStop(0.55, "rgba(255, 255, 255, 0)");
      frontShade.addColorStop(1, "rgba(0, 0, 0, 0.06)");
      ctx.fillStyle = frontShade;
      ctx.beginPath();
      ctx.arc(0, 0, drawRadius * 0.98, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.lineWidth = ringRadius * 0.04;
    ctx.strokeStyle = withOpacity(controls.globeRimColor, 0.16);
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, ringRadius * 0.98, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    requestAnimationFrame(render);
  };

  if (!imageReady) {
    image.addEventListener("load", () => {
      imageReady = true;
    }, { once: true });
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  const isActive = createViewportActivityTracker(canvas, { threshold: 0, rootMargin: "220px 0px 220px 0px" });
  requestAnimationFrame(render);
};

initializeHeroBurn(heroOrbCanvas, heroOrbImage, HERO_BURN_CONTROLS);

const initializeAccordions = (items) => {
  items.forEach((item) => {
    const summary = item.querySelector("summary");
    if (!summary) {
      return;
    }

    let content = item.querySelector(".accordion-item__content");
    if (!content) {
      content = document.createElement("div");
      content.className = "accordion-item__content";

      Array.from(item.children).forEach((child) => {
        if (child !== summary) {
          content.appendChild(child);
        }
      });

      item.appendChild(content);
    }

    const setContentHeight = (height) => {
      content.style.height = `${height}px`;
    };

    if (item.hasAttribute("open")) {
      setContentHeight(content.scrollHeight);
    } else {
      setContentHeight(0);
    }

    summary.addEventListener("click", (event) => {
      event.preventDefault();

      const isOpen = item.hasAttribute("open");

      if (isOpen) {
        setContentHeight(content.scrollHeight);
        requestAnimationFrame(() => {
          content.style.opacity = "0";
          setContentHeight(0);
        });

        const onCloseEnd = (closeEvent) => {
          if (closeEvent.propertyName !== "height") {
            return;
          }
          item.removeAttribute("open");
          content.removeEventListener("transitionend", onCloseEnd);
        };

        content.addEventListener("transitionend", onCloseEnd);
        return;
      }

      item.setAttribute("open", "");
      setContentHeight(0);

      requestAnimationFrame(() => {
        content.style.opacity = "1";
        setContentHeight(content.scrollHeight);
      });
    });
  });
};

initializeAccordions(accordionItems);

if (beliefSection) {
  const beliefObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        beliefSection.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.35,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  beliefObserver.observe(beliefSection);
}

if (impactSection) {
  const impactObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        impactSection.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.35,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  impactObserver.observe(impactSection);
}

if (lumaSection && lumaLoopVideo) {
  let lumaStarted = false;
  const startLumaLoop = async () => {
    if (lumaStarted) {
      return;
    }

    lumaStarted = true;
    lumaSection.classList.add("is-active", "is-looping");

    try {
      lumaLoopVideo.currentTime = 0;
      await lumaLoopVideo.play();
    } catch (_error) {}
  };

  const lumaObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        startLumaLoop();
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.45,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  lumaObserver.observe(lumaSection);
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    siteNav.classList.toggle("is-open", !expanded);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
    });
  });
}

const updateParallax = () => {
  const scrollY = window.scrollY;
  const heroThreshold = heroSection ? Math.max(heroSection.offsetHeight * 0.58, 220) : 220;

  if (header) {
    header.classList.toggle("is-visible", scrollY > heroThreshold);
    header.classList.toggle("is-scrolled", scrollY > heroThreshold + 36);
  }

  parallaxItems.forEach((item, index) => {
    const explicitSpeed = Number(item.getAttribute("data-parallax"));
    const speed = Number.isFinite(explicitSpeed) && explicitSpeed > 0 ? explicitSpeed : index === 0 ? 0.04 : 0.06;
    const offset = scrollY * speed;
    item.style.transform = `translate3d(0, ${offset}px, 0)`;
  });

  updateCollectivePortraitTone();
};

updateParallax();
let parallaxScheduled = false;
const scheduleParallaxUpdate = () => {
  if (parallaxScheduled) {
    return;
  }

  parallaxScheduled = true;
  requestAnimationFrame(() => {
    parallaxScheduled = false;
    updateParallax();
  });
};

window.addEventListener("scroll", scheduleParallaxUpdate, { passive: true });

if (contactForm && formNote) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

  if (contactHoneypotField) {
    contactHoneypotField.value = "";
  }

  const setFormMessage = (message, isError = false) => {
    formNote.textContent = message;
    formNote.classList.toggle("is-error", isError);
  };

  const hideContactChooser = () => {
    if (!contactChooser || !contactOptions) {
      return;
    }

    contactChooser.hidden = true;
    contactOptions.hidden = true;
    if (contactSubmitButton) {
      contactSubmitButton.hidden = false;
    }
  };

  const showChallenge = () => {
    if (!contactChallengePrompt) {
      return;
    }

    contactState.challengeA = Math.floor(Math.random() * 6) + 2;
    contactState.challengeB = Math.floor(Math.random() * 6) + 3;
    contactChallengePrompt.textContent = `What is ${contactState.challengeA} + ${contactState.challengeB}?`;
    const answerField = contactForm.elements.contact_check_answer;
    if (answerField) {
      answerField.value = "";
    }
  };

  const buildComposeLinks = () => {
    const name = contactForm.elements.name.value.trim();
    const email = contactForm.elements.email.value.trim();
    const message = contactForm.elements.message.value.trim();
    const recipient = String.fromCharCode(...CONTACT_EMAIL_CODES);
    const subject = `Collective Climate inquiry from ${name}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      message,
    ].join("\n");

    return {
      recipient,
      mailapp: `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      outlook: `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(recipient)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    };
  };

  const revealComposeOptions = () => {
    if (!contactChooser || !contactOptions) {
      return;
    }

    const links = buildComposeLinks();

    if (contactEmailLink) {
      contactEmailLink.textContent = links.recipient;
      contactEmailLink.href = `mailto:${links.recipient}`;
    }

    contactChooser.hidden = false;
    contactOptions.hidden = false;
    if (contactSubmitButton) {
      contactSubmitButton.hidden = true;
    }
    setFormMessage("Security check passed. Choose your email app or copy the address below.");
  };

  contactForm.addEventListener("input", () => {
    setFormMessage("", false);

    if (!contactOptions?.hidden) {
      showChallenge();
      hideContactChooser();
    }
  });

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = contactForm.elements.name.value.trim();
    const email = contactForm.elements.email.value.trim();
    const message = contactForm.elements.message.value.trim();
    const honeypot = contactHoneypotField?.value.trim() ?? "";

    hideContactChooser();

    if (honeypot) {
      setFormMessage("Submission blocked.", true);
      return;
    }

    if (!name || !email || !message) {
      setFormMessage("Please complete every field before sending. Thanks!", true);
      return;
    }

    if (!emailPattern.test(email)) {
      setFormMessage("Please enter a valid email address.", true);
      return;
    }

    if (Date.now() - contactState.startedAt < MIN_CONTACT_FILL_TIME_MS) {
      setFormMessage("Please take a moment to review your message, then try again.", true);
      return;
    }

    const answerField = contactForm.elements.contact_check_answer;
    const answer = Number.parseInt(answerField?.value.trim() ?? "", 10);
    const expectedAnswer = (contactState.challengeA ?? 0) + (contactState.challengeB ?? 0);

    if (!Number.isFinite(answer) || answer !== expectedAnswer) {
      setFormMessage("Please solve the math check before sending.", true);
      answerField?.focus();
      return;
    }

    revealComposeOptions();
  });

  const challengeAnswerField = contactForm.elements.contact_check_answer;
  if (challengeAnswerField) {
    challengeAnswerField.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      contactSubmitButton?.click();
    });
  }

  showChallenge();

  composeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.composeTarget;
      const links = buildComposeLinks();
      const url = links[target];

      if (!url) {
        return;
      }

      setFormMessage("Opening your draft.");

      if (target === "mailapp") {
        window.location.href = url;
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    });
  });
}
