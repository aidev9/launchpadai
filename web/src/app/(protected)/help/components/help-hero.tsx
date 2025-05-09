import Image from "next/image";

export function HelpHero() {
  return (
    <div className="relative rounded-lg overflow-hidden mb-12">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/founder-laptop1.webp" // Using an existing image from the project
          alt="Help Center"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40" />
      </div>

      <div className="relative z-10 px-6 py-16 md:py-24 text-white">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          We're Here to Help
        </h1>
        <p className="text-lg md:text-xl max-w-2xl">
          Our platform is actively being developed. We value your feedback and
          are here to assist you with any questions or issues you may encounter.
        </p>
      </div>
    </div>
  );
}
