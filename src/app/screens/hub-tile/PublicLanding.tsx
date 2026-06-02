import { Link } from "react-router";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { 
  Wheat, 
  Zap, 
  Bird, 
  Droplets, 
  Wifi, 
  Globe, 
  Users, 
  TrendingUp,
  Shield,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { Badge } from "../../components/ui/badge";

export function PublicLanding() {
  const features = [
    {
      icon: Zap,
      title: "Smart Power Generation",
      description: "Solar-powered energy system with real-time monitoring and load management to ensure continuous farm operations.",
      color: "text-yellow-600 bg-yellow-100"
    },
    {
      icon: Bird,
      title: "Automated Poultry Management",
      description: "IoT-enabled chicken coop with environmental control, automated feeding, and egg production tracking.",
      color: "text-orange-600 bg-orange-100"
    },
    {
      icon: Wheat,
      title: "Precision Crop Farming",
      description: "Smart irrigation and soil monitoring systems optimizing water usage and maximizing crop yields sustainably.",
      color: "text-green-600 bg-green-100"
    },
    {
      icon: Droplets,
      title: "Water Distribution System",
      description: "Intelligent water management with quality monitoring and automated distribution across all farm zones.",
      color: "text-blue-600 bg-blue-100"
    }
  ];

  const technologies = [
    { icon: Wifi, name: "LoRa Network", description: "Long-range wireless communication" },
    { icon: BarChart3, name: "Real-time Analytics", description: "Live data visualization" },
    { icon: Shield, name: "Secure Systems", description: "Protected data transmission" },
    { icon: TrendingUp, name: "Optimization", description: "AI-powered efficiency" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 h-16">
            <div className="min-w-0 flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <Wheat className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-base sm:text-lg text-slate-900 leading-tight truncate">Bela-Bela Smart Farm</h1>
                <p className="hidden sm:block text-xs text-slate-600">International Collaboration Project</p>
              </div>
            </div>
            <Link to="/login" className="shrink-0">
              <Button className="bg-green-600 hover:bg-green-700">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-6 bg-blue-600 text-lg px-4 py-2">
            International Partnership Project
          </Badge>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            Empowering Communities Through
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 mt-2">
              Smart Agriculture
            </span>
          </h2>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            A collaborative initiative between Belgium Campus ITVersity (South Africa) and 
            Pennsylvania State University (USA) to bring sustainable, technology-driven farming 
            solutions to the Bela-Bela community in South Africa.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6 gap-2">
                Access Dashboard
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Register Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Universities Section */}
      <section className="bg-white/60 backdrop-blur-sm py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-6 h-6 text-blue-600" />
                  <CardTitle className="text-xl">Belgium Campus ITVersity</CardTitle>
                </div>
                <CardDescription>Pretoria, South Africa</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Leading South African institution specializing in IT and technology education, 
                  providing local expertise and community connections for sustainable development projects.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-6 h-6 text-blue-600" />
                  <CardTitle className="text-xl">Pennsylvania State University</CardTitle>
                </div>
                <CardDescription>Pennsylvania, USA</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  World-renowned research university bringing advanced agricultural technology expertise 
                  and international collaboration experience to create innovative farming solutions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About the Project */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">About the Project</h3>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Our mission is to create a self-sustainable smart farm that addresses local challenges 
            while serving as a model for agricultural innovation in South Africa and beyond.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <Users className="w-10 h-10 text-green-600 mb-3" />
              <CardTitle>Community Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Providing the Bela-Bela community with food security, employment opportunities, 
                and knowledge transfer in modern farming techniques.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <Wifi className="w-10 h-10 text-blue-600 mb-3" />
              <CardTitle>IoT Technology</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Utilizing LoRa network technology for long-range, low-power sensor communication 
                enabling real-time monitoring across the entire farm.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader>
              <TrendingUp className="w-10 h-10 text-yellow-600 mb-3" />
              <CardTitle>Sustainability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Solar-powered infrastructure and smart water management ensure minimal environmental 
                impact while maximizing resource efficiency.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Smart Farm Features */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Smart Farm Systems</h3>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Four integrated subsystems work together to create a fully automated, 
              efficient, and sustainable farming operation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-3`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Our Technology</h3>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Cutting-edge technologies powering intelligent decision-making and automation
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {technologies.map((tech) => {
            const Icon = tech.icon;
            return (
              <div key={tech.name} className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">{tech.name}</h4>
                <p className="text-sm text-slate-600">{tech.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Project Structure */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Project Structure</h3>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Five dedicated teams collaborating to create an integrated smart farming solution
            </p>
          </div>

          <Card className="border-2 border-green-200">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Hub Team (This Platform)</h4>
                    <p className="text-slate-600">
                      Central system integration, web dashboard, database management, and LoRa network coordination
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-yellow-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Power Generation Team</h4>
                    <p className="text-slate-600">
                      Solar panel arrays, battery storage systems, and power distribution management
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Chicken Coop Team</h4>
                    <p className="text-slate-600">
                      Automated poultry management with environmental controls and health monitoring
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Crop Farm Team</h4>
                    <p className="text-slate-600">
                      Smart irrigation, soil monitoring, and crop health tracking systems
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                    5
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Water Distribution Team</h4>
                    <p className="text-slate-600">
                      Water quality monitoring, reservoir management, and intelligent distribution networks
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Explore the Dashboard?
          </h3>
          <p className="text-xl text-green-50 mb-8">
            Access real-time farm data, monitoring systems, and control interfaces
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 text-lg px-8 py-6 gap-2">
              Access the System
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Wheat className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white">Bela-Bela Smart Farm</span>
              </div>
              <p className="text-sm">
                Empowering communities through sustainable agriculture and technology innovation.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">Partner Institutions</h4>
              <ul className="space-y-2 text-sm">
                <li>Belgium Campus ITVersity</li>
                <li>Pennsylvania State University</li>
                <li>Bela-Bela Community</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">Technology</h4>
              <ul className="space-y-2 text-sm">
                <li>LoRa Network Communication</li>
                <li>IoT Sensor Systems</li>
                <li>Real-time Data Analytics</li>
                <li>Solar Power Integration</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-sm">
            <p>&copy; 2026 Bela-Bela Smart Farm Project. A collaboration between Belgium Campus ITVersity and Pennsylvania State University.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}