"use client"

import { useEffect, useRef } from "react"

export default function ScrollAnimate({ children, className }) {
  var ref = useRef(null)

  useEffect(function () {
    var element = ref.current
    if (!element) return

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible")
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(element)

    return function () {
      observer.disconnect()
    }
  }, [])

  return (
    <div ref={ref} className={"scroll-animate " + (className || "")}>
      {children}
    </div>
  )
}