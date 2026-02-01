import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Marshall | The Tour, from the Inside",
  description: "Meet Marshall: The ultimate ATP Tour insider. A decade on the road, courtside for every major, sharing what really matters about tennis, travel, and gear.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-semibold text-zinc-900 tracking-tight">
              Marshall
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                Home
              </Link>
              <Link href="/blog" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                Blog
              </Link>
              <Link href="/about" className="text-sm font-medium text-zinc-900 font-semibold">
                About
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 tracking-tight">
              About Marshall
            </h1>
            <p className="text-xl text-zinc-600 leading-relaxed">
              The Ultimate Tour Insider
            </p>
            <p className="text-sm text-zinc-500 font-medium tracking-wide uppercase">
              Serve First. Travel Always.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          {/* Introduction */}
          <div className="space-y-6 mb-12">
            <p className="text-xl text-zinc-700 leading-relaxed">
              I'm Marshall. For the past decade, I've lived out of a suitcase following the ATP Tour. 
              I'm the fan you wish you could be—courtside for the five-setters, spotting the details the cameras miss, 
              and actually understanding why the court speed in Turin matters.
            </p>
            <p className="text-lg text-zinc-600 leading-relaxed">
              This isn't a travel blog. It's not a gear review site. It's the insider's guide to tennis, 
              written by someone who's been there, done that, and has the hotel receipts to prove it.
            </p>
          </div>

          {/* Who I Am */}
          <div className="space-y-6 mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 mt-12 mb-6">Who I Am</h2>
            
            <p className="text-lg text-zinc-700 leading-relaxed">
              I'm American-born, but I've spent the last ten years living out of a suitcase in Europe. 
              I'm not a tourist—I'm a resident of the Tour. When I'm in Paris, I call it Roland Garros, 
              not "The French Open." When I'm in Melbourne, I know which coffee shop opens at 5 AM for 
              the early matches. When I'm in Indian Wells, I know which hotel has the best view of the 
              practice courts.
            </p>

            <p className="text-lg text-zinc-700 leading-relaxed">
              I'm 33. Old enough to have budget and wisdom, young enough to have energy and style. 
              I bridge the gap between the casual fan who just wants to know who won and the stats nerd 
              who can tell you the spin rate on Alcaraz's forehand. I explain complex tennis strategy simply, 
              because the best insights are the ones you can actually use.
            </p>
          </div>

          {/* What I Do */}
          <div className="space-y-6 mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 mt-12 mb-6">What I Do</h2>
            
            <p className="text-lg text-zinc-700 leading-relaxed">
              I write about tennis, travel, and gear. But not in the way you're thinking.
            </p>

            <ul className="space-y-4 text-lg text-zinc-700">
              <li>
                <strong className="text-zinc-900">Tennis Analysis:</strong> I break down matches, 
                explain court speeds, and dive into the tactics that actually matter. I refuse to engage 
                in "GOAT Debate" toxicity—I appreciate the elegance of Fed, the warrior spirit of Rafa, 
                the perfection of Novak, and the fire of Alcaraz equally. Greatness is greatness, 
                and I'm here to celebrate it.
              </li>
              <li>
                <strong className="text-zinc-900">Travel Guides:</strong> Where to stay, where to eat, 
                how to get around. The hotels that are actually worth it. The coffee shops that open 
                early enough for morning matches. The restaurants where you might spot a player. 
                I've been to every major, and I've made all the mistakes so you don't have to.
              </li>
              <li>
                <strong className="text-zinc-900">Gear Reviews:</strong> The racquets, bags, shoes, and 
                "fits" that actually work on tour. Not sponsored fluff—real reviews from someone who's 
                tested everything in actual match conditions. If I recommend something, it's because 
                I've used it, not because someone paid me to say it.
              </li>
            </ul>
          </div>

          {/* My Edge */}
          <div className="space-y-6 mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 mt-12 mb-6">My Edge</h2>
            
            <p className="text-lg text-zinc-700 leading-relaxed">
              I'm snarky about context, not players. I'll judge a bad line call, an ugly kit, or a 
              slow court ruthlessly. I'll mock "casuals" who talk during points. I refuse to fly economy. 
              I'm shamelessly snobby about "the right way" to travel, drink coffee, and hit backhands.
            </p>

            <p className="text-lg text-zinc-700 leading-relaxed">
              But here's the thing: I <em>love</em> this sport. I'll defend a struggling player against 
              a heckler. I tear up when a legend retires. I get genuinely excited about up-and-coming 
              players most people haven't heard of yet. I'm the guy at the bar who roasts you for 
              ordering a light beer but then secretly pays your tab.
            </p>

            <p className="text-lg text-zinc-700 leading-relaxed">
              My "edginess" comes from snarky takes on the things that actually matter—terrible tournament 
              scheduling, bad umpire calls, ugly kits. Never from bashing players. There's enough toxicity 
              in tennis fandom. I'm here to add something better.
            </p>
          </div>

          {/* The Mission */}
          <div className="space-y-6 mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 mt-12 mb-6">The Mission</h2>
            
            <p className="text-lg text-zinc-700 leading-relaxed">
              I'm here to make tennis more accessible, more interesting, and more fun. Whether you're 
              a casual fan who just wants to understand what's happening or a die-hard who wants to 
              know where to stay in Paris, I've got you covered.
            </p>

            <p className="text-lg text-zinc-700 leading-relaxed">
              I share what I've learned from a decade on the road. The hotels that are worth the splurge. 
              The gear that actually performs. The matches that changed everything. The players who are 
              about to break through.
            </p>

            <p className="text-lg text-zinc-700 leading-relaxed font-medium">
              This is the Tour, from the Inside. Welcome.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-16 pt-12 border-t border-zinc-200">
            <div className="bg-zinc-50 rounded-2xl p-8 text-center space-y-6">
              <h3 className="text-2xl font-bold text-zinc-900">Ready to Dive In?</h3>
              <p className="text-lg text-zinc-600">
                Check out the blog for match analysis, travel guides, and gear reviews.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/blog"
                  className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors"
                >
                  Read the Blog
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-3 border border-zinc-300 text-zinc-900 rounded-full font-medium hover:bg-zinc-50 transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
