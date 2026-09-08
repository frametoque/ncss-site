import { Button } from "@/components/ui/button";
import { MapPin, Mail, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-6">Get in Touch</h1>
          <p className="text-lg text-gray-600">
            Have a question about our events, want to contribute to the magazine, or interested in sponsoring? We'd love to hear from you.
          </p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-maroon-50 rounded-full mb-8">
            <Mail className="h-8 w-8 text-maroon-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Contact Information</h2>
          
          <ul className="space-y-6 text-gray-600 flex flex-col items-center">
            <li className="flex flex-col items-center gap-2">
              <MapPin className="h-6 w-6 text-maroon-500 mb-1" />
              <span className="font-medium text-gray-900">Nalanda College</span>
              <span>Colombo 10, Sri Lanka</span>
            </li>
            
            <li className="w-16 h-px bg-gray-100 my-2"></li>
            
            <li className="flex flex-col items-center gap-2">
              <Mail className="h-6 w-6 text-maroon-500 mb-1" />
              <a href="mailto:info@ncss.example.com" className="hover:text-maroon-600 transition-colors font-medium">
                info@ncss.example.com
              </a>
            </li>
            
            <li className="w-16 h-px bg-gray-100 my-2"></li>
            
            <li className="flex flex-col items-center gap-2">
              <Phone className="h-6 w-6 text-maroon-500 mb-1" />
              <span className="font-medium">
                +94 11 200 0000
              </span>
            </li>

            <li className="w-16 h-px bg-gray-100 my-4"></li>
            
            <li className="flex flex-col items-center gap-4 w-full pt-2">
              <h3 className="font-bold text-gray-900">Connect With Us</h3>
              <div className="flex flex-wrap justify-center gap-6">
                <a href="https://www.facebook.com/nalandasciencesl/#" target="_blank" rel="noopener noreferrer" className="bg-gray-50 p-3 rounded-full text-gray-400 hover:text-[#1877F2] hover:bg-blue-50 transition-colors" aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a href="https://x.com/nalandancss" target="_blank" rel="noopener noreferrer" className="bg-gray-50 p-3 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors" aria-label="X (Twitter)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://www.instagram.com/nalanda_science_society" target="_blank" rel="noopener noreferrer" className="bg-gray-50 p-3 rounded-full text-gray-400 hover:text-[#E4405F] hover:bg-pink-50 transition-colors" aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                </a>
                <a href="https://www.threads.com/@nalanda_science_society?igshid=NTc4MTIwNjQ2YQ==" target="_blank" rel="noopener noreferrer" className="bg-gray-50 p-3 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors flex items-center justify-center w-12 h-12" aria-label="Threads">
                  <span className="font-bold text-xl leading-none">@</span>
                </a>
                <a href="https://youtube.com/@nalandacollegesciencesociety" target="_blank" rel="noopener noreferrer" className="bg-gray-50 p-3 rounded-full text-gray-400 hover:text-[#FF0000] hover:bg-red-50 transition-colors" aria-label="YouTube">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7.1C2.5 5.4 3.9 4 5.6 4h12.8c1.7 0 3.1 1.4 3.1 3.1v9.8c0 1.7-1.4 3.1-3.1 3.1H5.6c-1.7 0-3.1-1.4-3.1-3.1V7.1z"></path><path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z"></path></svg>
                </a>
                <a href="https://whatsapp.com/channel/0029VaozV2m0LKZIxJ7iml3J" target="_blank" rel="noopener noreferrer" className="bg-gray-50 p-3 rounded-full text-gray-400 hover:text-[#25D366] hover:bg-green-50 transition-colors" aria-label="WhatsApp">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
