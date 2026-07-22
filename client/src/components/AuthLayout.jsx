import FrameAnimation from './FrameAnimation';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - Animation (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
        <FrameAnimation loop={true} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-12 z-10">
          <div>
            <h2
              className="text-4xl xl:text-5xl font-extrabold text-white font-display leading-tight mb-4"
              style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
            >
              Donate Blood,<br />Save Lives.
            </h2>
            <p className="text-white/60 text-lg max-w-md leading-relaxed">
              Join thousands of heroes who are making a difference. Find donors, respond to emergencies, and be someone's reason to live.
            </p>

            <div className="flex gap-8 mt-8">
              <div>
                <p className="text-3xl font-extrabold text-white font-display">12K+</p>
                <p className="text-white/50 text-sm mt-1">Lives Saved</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-white font-display">5K+</p>
                <p className="text-white/50 text-sm mt-1">Active Donors</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-white font-display">350+</p>
                <p className="text-white/50 text-sm mt-1">Blood Camps</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-red-50/30 relative">
        {/* Mobile background */}
        <div className="lg:hidden absolute inset-0 overflow-hidden">
          <FrameAnimation loop={true} />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        </div>

        <div className="w-full max-w-md px-6 py-12 relative z-10">
          <div className="bg-white/90 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl shadow-gray-900/10 border border-gray-100">
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo.png" alt="BloodOcean" className="h-10 w-10 rounded-full object-cover ring-2 ring-red-200" />
                <span className="font-extrabold text-2xl font-display text-gray-900">BloodOcean</span>
              </div>
              <h2 className="text-center text-3xl sm:text-4xl font-extrabold text-gray-900 font-display">
                {title}
              </h2>
              <p className="mt-2 text-center text-gray-500">{subtitle}</p>
              <div className="mt-3 px-4 py-2 bg-gradient-to-r from-red-50 to-red-100/50 rounded-full border border-red-200/50">
                <p className="text-sm font-medium text-red-700 text-center">
                  "Every drop counts"
                </p>
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
