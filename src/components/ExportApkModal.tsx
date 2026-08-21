import React, { useState } from 'react';

interface ExportApkModalProps {
  onClose: () => void;
}

export const ExportApkModal: React.FC<ExportApkModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'capacitor' | 'expo' | 'github'>('capacitor');
  const [copied, setCopied] = useState(false);

  const capacitorCommands = `# 1. Export repository ke GitHub / Clone repo
git clone <repo-url>
cd musika-nusantara

# 2. Install dependencies & Capacitor Android
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android

# 3. Inisialisasi Aplikasi Android
npx cap init "Musika Nusantara" "com.musikanusantara.app" --web-dir dist

# 4. Build web bundle & generate Android APK project
npm run build
npx cap add android
npx cap sync

# 5. Buka di Android Studio untuk Build APK / AAB
npx cap open android`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade-in">
      <div className="glass-card w-full max-w-lg rounded-3xl p-6 border border-white/20 flex flex-col gap-4 text-left shadow-[0_0_50px_rgba(0,228,121,0.3)] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00E479] text-[28px]">android</span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Panduan Export & Build APK</h3>
              <p className="text-[11px] text-[#CFC2D7]">Musika Nusantara Android App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 p-1 bg-[#1A1A1A] rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('capacitor')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'capacitor' ? 'bg-[#00E479] text-[#121212] shadow-md' : 'text-[#CFC2D7] hover:text-white'
            }`}
          >
            Capacitor (Instan APK)
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'github' ? 'bg-[#FFD700] text-[#121212] shadow-md' : 'text-[#CFC2D7] hover:text-white'
            }`}
          >
            Export ke GitHub
          </button>
          <button
            onClick={() => setActiveTab('expo')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'expo' ? 'bg-[#8A2BE2] text-white shadow-md' : 'text-[#CFC2D7] hover:text-white'
            }`}
          >
            Expo React Native
          </button>
        </div>

        {/* Content */}
        {activeTab === 'capacitor' && (
          <div className="space-y-3 text-xs text-[#E5E2E1]">
            <p>
              Cara tercepat mengubah proyek web ini menjadi file <strong>APK Android Asli</strong> yang siap diinstall di HP:
            </p>

            <div className="relative bg-[#121212] border border-white/10 rounded-xl p-3 font-mono text-[11px] text-[#00E479] leading-relaxed overflow-x-auto">
              <pre>{capacitorCommands}</pre>
              <button
                onClick={() => handleCopy(capacitorCommands)}
                className="absolute top-2 right-2 px-2.5 py-1 rounded bg-[#00E479] text-[#121212] text-[10px] font-bold shadow cursor-pointer hover:bg-[#00c968]"
              >
                {copied ? 'Tersalin!' : 'Salin Perintah'}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#00E479]/10 border border-[#00E479]/30 text-[11px]">
              💡 <strong>Tips:</strong> Setelah <code>npx cap open android</code>, klik menu <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK</strong> di Android Studio untuk mendapatkan file <code>app-debug.apk</code>!
            </div>
          </div>
        )}

        {activeTab === 'github' && (
          <div className="space-y-3 text-xs text-[#E5E2E1]">
            <p>
              Kamu bisa meng-export source code aplikasi ini ke akun GitHub pribadimu:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-[#CFC2D7]">
              <li>Buka menu <strong>Settings</strong> di pojok kanan atas Google AI Studio.</li>
              <li>Pilih <strong>Export to GitHub</strong> atau <strong>Download ZIP</strong>.</li>
              <li>Beri nama repositori: <code className="text-[#FFD700]">musika-nusantara-app</code>.</li>
              <li>Repository akan otomatis terhubung ke akun GitHub kamu lengkap dengan seluruh struktur kode dan aset.</li>
            </ol>
          </div>
        )}

        {activeTab === 'expo' && (
          <div className="space-y-3 text-xs text-[#E5E2E1]">
            <p>
              Jika ingin menjalankan menggunakan Expo CLI (React Native):
            </p>
            <div className="bg-[#121212] border border-white/10 rounded-xl p-3 font-mono text-[11px] text-[#DCB8FF]">
              <p>npx create-expo-app musika-nusantara --template blank-typescript</p>
              <p>npx expo install expo-av @react-native-async-storage/async-storage</p>
              <p>eas build -p android --profile preview</p>
            </div>
            <p className="text-[11px] text-[#CFC2D7]">
              Logika audio, komponen screen (Onboarding, Create, Player, Library, Explore), dan styling tema gelap #0A0A0A sudah 100% kompatibel dan siap dipetakan ke Expo komponen.
            </p>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
