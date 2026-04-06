import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zenv.app',
  appName: 'Zen-V',
  webDir: 'dist',
  server: {
    // Giúp Capacitor xử lý tốt hơn các đường dẫn file cục bộ
    androidScheme: 'https',
    // Cho phép kết nối tới các domain của Google & Firebase
    allowNavigation: [
      'identitytoolkit.googleapis.com',
      'securetoken.googleapis.com',
      'firestore.googleapis.com',
      'generativelanguage.googleapis.com'
    ]
  },
  android: {
    // Cho phép app gọi API qua HTTP/HTTPS mà không bị chặn bởi chính sách bảo mật mặc định
    allowMixedContent: true
  }
};

export default config;
