"use client"

import { Quote } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

const testimonials = [
  {
    quote: "SourceNest transformed how we find suppliers. The review process gives us confidence, and the direct communication saves weeks of back-and-forth.",
    author: "Sarah Chen",
    role: "Procurement Director",
    company: "Nordic Home Goods",
    type: "buyer",
  },
  {
    quote: "Since joining SourceNest, we've received quality inquiries from serious buyers in markets we never thought we could reach. The ROI has been incredible.",
    author: "Rajesh Patel",
    role: "Export Manager",
    company: "GreenThread Textiles",
    type: "manufacturer",
  },
  {
    quote: "The comparison feature is a game-changer. Being able to evaluate multiple suppliers side-by-side with reviewed information speeds up our sourcing decisions.",
    author: "Michael Torres",
    role: "Supply Chain Manager",
    company: "Urban Retail Co",
    type: "buyer",
  },
]

export function TestimonialsSection() {
  const { t } = useTranslation()
  return (
    <section className="bg-muted/50 py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {t.landing.testimonials.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t.landing.testimonials.subtitle}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="rounded-xl bg-card p-4 shadow-sm sm:rounded-2xl sm:p-6 lg:p-8">
              <Quote className="h-7 w-7 text-secondary/30 sm:h-9 sm:w-9 lg:h-10 lg:w-10" />
              <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-foreground sm:mt-4 sm:line-clamp-none sm:text-base">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="mt-4 border-t border-border pt-4 sm:mt-6 sm:pt-6">
                <div className="text-sm font-semibold text-foreground sm:text-base">{testimonial.author}</div>
                <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground sm:text-sm">
                  {testimonial.role}, {testimonial.company}
                </div>
                <div className="mt-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium sm:px-3 sm:py-1 sm:text-xs ${
                    testimonial.type === "buyer" 
                      ? "bg-blue-100 text-blue-800" 
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {testimonial.type === "buyer" ? "Buyer" : "Manufacturer"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
