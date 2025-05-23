import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <header className="bg-indigo-600">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
          <div className="w-full py-6 flex items-center justify-between border-b border-indigo-500 lg:border-none">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">ACPN Ota Zone</span>
              <div className="hidden ml-10 space-x-8 lg:block">
                <Link to="#about" className="text-base font-medium text-white hover:text-indigo-50">
                  About
                </Link>
                <Link to="#features" className="text-base font-medium text-white hover:text-indigo-50">
                  Features
                </Link>
                <Link to="#contact" className="text-base font-medium text-white hover:text-indigo-50">
                  Contact
                </Link>
              </div>
            </div>
            <div className="ml-10 space-x-4">
              <Link
                to="/login"
                className="inline-block bg-indigo-500 py-2 px-4 border border-transparent rounded-md text-base font-medium text-white hover:bg-opacity-75"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-block bg-white py-2 px-4 border border-transparent rounded-md text-base font-medium text-indigo-600 hover:bg-indigo-50"
              >
                Register
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero section */}
        <div className="relative">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gray-100"></div>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="relative shadow-xl sm:rounded-2xl sm:overflow-hidden">
              <div className="absolute inset-0">
                <img
                  className="h-full w-full object-cover"
                  src="https://images.unsplash.com/photo-1576602976047-174e57a47881?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                  alt="Pharmacy"
                />
                <div className="absolute inset-0 bg-indigo-700 mix-blend-multiply"></div>
              </div>
              <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
                <h1 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  <span className="block text-white">Association of Community</span>
                  <span className="block text-indigo-200">Pharmacists of Nigeria</span>
                  <span className="block text-white">Ota Zone</span>
                </h1>
                <p className="mt-6 max-w-lg mx-auto text-center text-xl text-indigo-200 sm:max-w-3xl">
                  A comprehensive portal for managing pharmacy registrations, dues, events, 
                  elections, and communications for ACPN Ota Zone members.
                </p>
                <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                  <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                    <Link
                      to="/login"
                      className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 sm:px-8"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 sm:px-8"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features section */}
        <div id="features" className="py-16 bg-gray-100 overflow-hidden lg:py-24">
          <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
            <div className="relative">
              <h2 className="text-center text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                A Modern Portal for Pharmacy Management
              </h2>
              <p className="mt-4 max-w-3xl mx-auto text-center text-xl text-gray-500">
                Our platform provides comprehensive tools to streamline pharmacy operations,
                increase collaboration, and improve administrative efficiency.
              </p>
            </div>

            <div className="relative mt-12 lg:mt-24 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
              <div className="relative">
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">
                  For Pharmacy Owners
                </h3>
                <p className="mt-3 text-lg text-gray-500">
                  Manage your pharmacy profile, track dues payments, and stay informed about zone activities.
                </p>

                <dl className="mt-10 space-y-10">
                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                        <i className="fas fa-building"></i>
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Pharmacy Registration</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Register your pharmacy details including location, license information, and contact details.
                    </dd>
                  </div>

                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                        <i className="fas fa-money-bill"></i>
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Dues Management</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Track your dues payments, payment history, and upcoming financial obligations.
                    </dd>
                  </div>

                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                        <i className="fas fa-calendar"></i>
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Event Participation</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Register for zone events, track attendance, and access event materials.
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-10 -mx-4 relative lg:mt-0" aria-hidden="true">
                <img
                  className="relative mx-auto rounded-lg shadow-lg"
                  src="https://images.unsplash.com/photo-1587370560942-ad2a04eabb6d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                  alt="Pharmacist working"
                />
              </div>
            </div>

            <div className="relative mt-12 sm:mt-16 lg:mt-24">
              <div className="lg:grid lg:grid-flow-row-dense lg:grid-cols-2 lg:gap-8 lg:items-center">
                <div className="lg:col-start-2">
                  <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">
                    For Zone Administrators
                  </h3>
                  <p className="mt-3 text-lg text-gray-500">
                    Comprehensive tools for managing the zone's operations, communications, and governance.
                  </p>

                  <dl className="mt-10 space-y-10">
                    <div className="relative">
                      <dt>
                        <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                          <i className="fas fa-users"></i>
                        </div>
                        <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Member Management</p>
                      </dt>
                      <dd className="mt-2 ml-16 text-base text-gray-500">
                        Complete user and pharmacy management with approval workflows and detailed reporting.
                      </dd>
                    </div>

                    <div className="relative">
                      <dt>
                        <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                          <i className="fas fa-vote-yea"></i>
                        </div>
                        <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Elections & Polls</p>
                      </dt>
                      <dd className="mt-2 ml-16 text-base text-gray-500">
                        Create and manage elections, process candidate registrations, and collect member feedback through polls.
                      </dd>
                    </div>

                    <div className="relative">
                      <dt>
                        <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                          <i className="fas fa-chart-line"></i>
                        </div>
                        <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Financial Oversight</p>
                      </dt>
                      <dd className="mt-2 ml-16 text-base text-gray-500">
                        Track zone finances, manage dues collection, and maintain transparency with financial reports.
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-10 -mx-4 relative lg:mt-0 lg:col-start-1">
                  <img
                    className="relative mx-auto rounded-lg shadow-lg"
                    src="https://images.unsplash.com/photo-1590051207943-12e22e34e5a9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                    alt="Team collaboration"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div id="contact" className="bg-indigo-700">
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Ready to get started?</span>
              <span className="block">Join ACPN Ota Zone today.</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-indigo-200">
              Register your pharmacy and become a part of our growing community of professional pharmacists.
            </p>
            <Link
              to="/register"
              className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 sm:w-auto"
            >
              Register Now
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
            <div className="px-5 py-2">
              <Link to="#" className="text-base text-gray-400 hover:text-gray-300">
                About
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link to="#" className="text-base text-gray-400 hover:text-gray-300">
                Features
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link to="#" className="text-base text-gray-400 hover:text-gray-300">
                Privacy
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link to="#" className="text-base text-gray-400 hover:text-gray-300">
                Terms
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link to="#" className="text-base text-gray-400 hover:text-gray-300">
                Contact
              </Link>
            </div>
          </nav>
          <div className="mt-8 flex justify-center space-x-6">
            <a href="#" className="text-gray-400 hover:text-gray-300">
              <span className="sr-only">Facebook</span>
              <i className="fab fa-facebook fa-2x"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-300">
              <span className="sr-only">Twitter</span>
              <i className="fab fa-twitter fa-2x"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-300">
              <span className="sr-only">Instagram</span>
              <i className="fab fa-instagram fa-2x"></i>
            </a>
          </div>
          <p className="mt-8 text-center text-base text-gray-400">
            &copy; {new Date().getFullYear()} Association of Community Pharmacists of Nigeria, Ota Zone. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
