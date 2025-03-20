function AboutMTN() {
  return (
    <div className="p-6 max-w-full bg-gray-50 h-svh">
      <h1 className="text-4xl font-bold text-mtn-green-800 mb-6">About MTN</h1>
      <div className="bg-white rounded-lg shadow-md p-6 mt-6 border-t-4 border-t-mtn-green-800">
        <h2 className="text-2xl font-semibold text-green-800 pb-2 mb-4 inline-block">
          Our Approach
        </h2>
        <p className="text-slate-800 mt-4 font-poppins">
          MTN bridges agricultural heritage and technological innovation. We
          transform data from government agencies, satellites, and environmental
          models into strategic assets for agricultural enterprises.
        </p>

        <h3 className="text-xl font-semibold text-mtn-green-800 mt-6 mb-3">
          AI-Powered Advantages
        </h3>
        <p className="text-slate-800 mb-4 font-poppins">
          Our specialized AI algorithms deliver three key advantages:
        </p>
        <ul className="list-disc pl-8 mb-6 text-slate-800 font-poppins">
          <li className="mb-2">
            Precise crop yield forecasts that outperform traditional models
          </li>
          <li className="mb-2">
            Early detection systems that identify crop stress before visual
            symptoms appear
          </li>
          <li className="mb-2">
            Multilingual advisory systems that deliver agricultural guidance to
            farmers in regional languages they understand
          </li>
        </ul>

        <p className="text-slate-800 mt-4 font-poppins">
          We don{"'"}t just deliver data—we deliver certainty in an uncertain
          landscape. Our solutions help agriculture related agencies move from
          reactive to proactive management. Our direct farmer engagement ensures
          insights translate to on-ground implementation.
        </p>

        <p className="text-slate-800 mt-4 font-poppins">
          Trusted by agricultural leaders and researchers, MTN is ready to
          revolutionize how your organization approaches agricultural
          intelligence.
        </p>

        <div className="mt-8 pt-4 border-t border-gray-200">
          <p className="text-slate-800 font-poppins">
            Connect with us to discuss how our capabilities can address your
            specific challenges.
          </p>
          <a
            href="mailto:ceo@mtnearth.com"
            className="inline-block mt-2 text-mtn-green-800 font-semibold hover:underline"
          >
            ceo@mtnearth.com
          </a>
        </div>
      </div>
    </div>
  );
}

export default AboutMTN;
