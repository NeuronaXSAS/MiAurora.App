"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

interface AuroraShaderProps {
  className?: string
  /** Reduce animation for accessibility */
  reducedMotion?: boolean
}

export function AuroraShader({ className = "", reducedMotion = false }: AuroraShaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    animationId: number
  } | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion || reducedMotion) {
      setIsSupported(false)
      return
    }

    if (!containerRef.current) return

    // Check WebGL support
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    if (!gl) {
      setIsSupported(false)
      return
    }

    const container = containerRef.current

    // Vertex shader
    const vertexShader = `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `

    // Fragment shader - Aurora colors (violet, pink, lavender, mint)
    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359
      precision highp float;
      
      uniform vec2 resolution;
      uniform float time;
      
      // Aurora color palette
      vec3 auroraViolet = vec3(0.24, 0.05, 0.45);   // #3d0d73
      vec3 auroraPurple = vec3(0.33, 0.22, 0.65);   // #5537a7
      vec3 auroraPink = vec3(0.95, 0.62, 0.90);     // #f29de5
      vec3 auroraLavender = vec3(0.79, 0.81, 0.96); // #c9cef4
      vec3 auroraMint = vec3(0.84, 0.96, 0.93);     // #d6f4ec
      
      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time * 0.03; // Slower, more elegant animation
        float lineWidth = 0.0015;
        
        vec3 color = vec3(0.0);
        
        // Create aurora wave effect with brand colors
        for(int j = 0; j < 3; j++) {
          for(int i = 0; i < 4; i++) {
            float wave = lineWidth * float(i * i) / abs(
              fract(t - 0.008 * float(j) + float(i) * 0.012) * 4.0 
              - length(uv) 
              + mod(uv.x + uv.y, 0.15)
            );
            
            // Blend Aurora colors based on position and iteration
            vec3 layerColor;
            if (j == 0) {
              layerColor = mix(auroraViolet, auroraPurple, float(i) / 4.0);
            } else if (j == 1) {
              layerColor = mix(auroraPink, auroraLavender, float(i) / 4.0);
            } else {
              layerColor = mix(auroraMint, auroraPurple, float(i) / 4.0);
            }
            
            color += wave * layerColor * 1.5;
          }
        }
        
        // Add subtle glow
        float glow = 0.02 / (0.1 + length(uv) * 0.5);
        color += glow * auroraPurple * 0.3;
        
        // Soft vignette
        float vignette = 1.0 - length(uv) * 0.4;
        color *= vignette;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `

    // Initialize Three.js scene
    const camera = new THREE.Camera()
    camera.position.z = 1

    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2)

    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2() },
    }

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "low-power" // Better for mobile battery
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Cap at 2x for performance
    container.appendChild(renderer.domElement)

    // Handle resize
    const onWindowResize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      renderer.setSize(width, height)
      uniforms.resolution.value.x = renderer.domElement.width
      uniforms.resolution.value.y = renderer.domElement.height
    }

    onWindowResize()
    window.addEventListener("resize", onWindowResize, false)

    // Animation loop with throttling for mobile
    let lastTime = 0
    const targetFPS = 30 // Lower FPS for better mobile performance
    const frameInterval = 1000 / targetFPS

    const animate = (currentTime: number) => {
      const animationId = requestAnimationFrame(animate)
      
      if (sceneRef.current) {
        sceneRef.current.animationId = animationId
      }

      const deltaTime = currentTime - lastTime
      if (deltaTime < frameInterval) return
      
      lastTime = currentTime - (deltaTime % frameInterval)
      uniforms.time.value += 0.05
      renderer.render(scene, camera)
    }

    sceneRef.current = {
      renderer,
      animationId: 0,
    }

    animate(0)

    // Cleanup
    return () => {
      window.removeEventListener("resize", onWindowResize)
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId)
        if (container && sceneRef.current.renderer.domElement) {
          container.removeChild(sceneRef.current.renderer.domElement)
        }
        sceneRef.current.renderer.dispose()
        geometry.dispose()
        material.dispose()
      }
    }
  }, [reducedMotion])

  // Fallback gradient for unsupported devices
  if (!isSupported) {
    return (
      <div 
        className={`${className}`}
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(85,55,167,0.15) 0%, rgba(242,157,229,0.1) 40%, transparent 70%)",
        }}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className={`${className}`}
      style={{
        background: "#3d0d73",
        overflow: "hidden",
      }}
      aria-hidden="true"
    />
  )
}
