// ============================================
// CafeFinder 3D Scene (Three.js)
// ============================================
window.CafeScene = (() => {
  let scene, camera, renderer;
  let coffeeBeans = [];
  let particles = [];
  let mouseX = 0, mouseY = 0;
  let scrollProgress = 0;
  let animationId;
  let isInitialized = false;

  function init() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
      console.warn('Three.js not loaded, skipping 3D scene');
      return;
    }

    const isMobile = window.innerWidth < 768;
    const beanCount = isMobile ? 60 : 150;
    const particleCount = isMobile ? 100 : 300;

    // Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.035);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 30;

    // Renderer
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobile,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a0a, 1);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xc8956c, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xc8956c, 1.5, 50);
    pointLight1.position.set(10, 15, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xf0c040, 0.8, 50);
    pointLight2.position.set(-15, -10, 5);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xd4a373, 0.6, 40);
    pointLight3.position.set(0, 0, 20);
    scene.add(pointLight3);

    // Create coffee beans (icosahedrons)
    const beanGeometry = new THREE.IcosahedronGeometry(0.3, 0);
    const beanMaterials = [
      new THREE.MeshPhongMaterial({ color: 0x6f4e37, shininess: 80 }),
      new THREE.MeshPhongMaterial({ color: 0x8b6914, shininess: 80 }),
      new THREE.MeshPhongMaterial({ color: 0x5c3d2e, shininess: 80 }),
      new THREE.MeshPhongMaterial({ color: 0x7b5b3a, shininess: 80 }),
    ];

    for (let i = 0; i < beanCount; i++) {
      const material = beanMaterials[i % beanMaterials.length];
      const bean = new THREE.Mesh(beanGeometry, material);
      bean.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 30
      );
      bean.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      bean.userData = {
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.01
        },
        floatSpeed: 0.003 + Math.random() * 0.005,
        floatOffset: Math.random() * Math.PI * 2,
        originalY: bean.position.y
      };
      scene.add(bean);
      coffeeBeans.push(bean);
    }

    // Create ambient sparkle particles
    const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
    const particleMaterials = [
      new THREE.MeshBasicMaterial({ color: 0xf5e6d3, transparent: true, opacity: 0.6 }),
      new THREE.MeshBasicMaterial({ color: 0xf0c040, transparent: true, opacity: 0.4 }),
      new THREE.MeshBasicMaterial({ color: 0xc8956c, transparent: true, opacity: 0.5 }),
    ];

    for (let i = 0; i < particleCount; i++) {
      const material = particleMaterials[i % particleMaterials.length];
      const particle = new THREE.Mesh(particleGeometry, material.clone());
      particle.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 40
      );
      particle.userData = {
        twinkleSpeed: 0.01 + Math.random() * 0.03,
        twinkleOffset: Math.random() * Math.PI * 2,
        driftSpeed: {
          x: (Math.random() - 0.5) * 0.005,
          y: 0.005 + Math.random() * 0.01,
          z: (Math.random() - 0.5) * 0.003
        }
      };
      scene.add(particle);
      particles.push(particle);
    }

    // Event listeners
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    isInitialized = true;
    animate();
  }

  function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
  }

  function onResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onScroll() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = window.scrollY / maxScroll;
  }

  function animate() {
    animationId = requestAnimationFrame(animate);

    const time = Date.now() * 0.001;

    // Camera follows mouse for parallax
    camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 3 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    // Animate coffee beans
    coffeeBeans.forEach(bean => {
      bean.rotation.x += bean.userData.rotSpeed.x;
      bean.rotation.y += bean.userData.rotSpeed.y;
      bean.rotation.z += bean.userData.rotSpeed.z;
      bean.position.y = bean.userData.originalY +
        Math.sin(time * bean.userData.floatSpeed * 10 + bean.userData.floatOffset) * 2;
    });

    // Animate particles (twinkle + drift)
    particles.forEach(particle => {
      const opacity = 0.3 + Math.sin(time * particle.userData.twinkleSpeed * 10 + particle.userData.twinkleOffset) * 0.3;
      particle.material.opacity = Math.max(0.1, opacity);
      particle.position.y += particle.userData.driftSpeed.y;
      particle.position.x += particle.userData.driftSpeed.x;

      // Reset particles that drift too far
      if (particle.position.y > 30) {
        particle.position.y = -30;
        particle.position.x = (Math.random() - 0.5) * 60;
      }
    });

    // Adjust scene based on scroll
    scene.rotation.y = scrollProgress * 0.3;
    scene.rotation.x = scrollProgress * 0.1;

    renderer.render(scene, camera);
  }

  function destroy() {
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('scroll', onScroll);
    if (renderer) renderer.dispose();
    isInitialized = false;
  }

  return { init, destroy };
})();
