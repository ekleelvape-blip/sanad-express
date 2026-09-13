const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

let currentTunnelUrl = null;
let tunnelProcess = null;

function getLocalIp() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (e) {}
  return '192.168.1.232';
}

function getSavedTunnelUrl() {
  if (currentTunnelUrl) return currentTunnelUrl;
  if (process.env.TUNNEL_URL) {
    currentTunnelUrl = process.env.TUNNEL_URL.trim();
    return currentTunnelUrl;
  }
  const tunnelFile = path.join(__dirname, '..', '.tunnel_url');
  if (fs.existsSync(tunnelFile)) {
    try {
      const saved = fs.readFileSync(tunnelFile, 'utf8').trim();
      if (saved && saved.startsWith('http')) {
        currentTunnelUrl = saved;
        return currentTunnelUrl;
      }
    } catch (e) {}
  }
  return null;
}

function startTunnel(port = 5000) {
  const existingUrl = getSavedTunnelUrl();
  const cloudflaredPath = path.join(__dirname, '..', 'cloudflared.exe');
  
  if (!fs.existsSync(cloudflaredPath)) {
    console.log('ℹ️ cloudflared.exe not found in root. Using local network address.');
    return;
  }

  if (tunnelProcess) {
    return;
  }

  if (existingUrl) {
    fetch(existingUrl + '/api/branches')
      .then(res => {
        if (res.ok) {
          console.log('\n============================================================');
          console.log('🚀 رابط المندوب السريع والآمن للجوال (HTTPS سحابي - نشط):');
          console.log('   ' + existingUrl + '/driver');
          console.log('📡 رابط المندوب على شبكة الواي فاي المحلية:');
          console.log('   http://' + getLocalIp() + ':' + port + '/driver');
          console.log('============================================================\n');
        } else {
          spawnNewTunnel(cloudflaredPath, port);
        }
      })
      .catch(() => {
        spawnNewTunnel(cloudflaredPath, port);
      });
  } else {
    spawnNewTunnel(cloudflaredPath, port);
  }
}

function spawnNewTunnel(cloudflaredPath, port) {
  try {
    console.log('⏳ جاري تشغيل نفق Cloudflare الآمن لربط الجوال بدون قيود...');
    tunnelProcess = spawn(cloudflaredPath, ['tunnel', '--url', 'http://localhost:' + port, '--protocol', 'http2'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const urlRegex = /https:\/\/[a-z0-9\-]+\.trycloudflare\.com/i;
    const tunnelFile = path.join(__dirname, '..', '.tunnel_url');

    const handleData = (chunk) => {
      const text = chunk.toString();
      const match = text.match(urlRegex);
      if (match && (!currentTunnelUrl || currentTunnelUrl !== match[0])) {
        currentTunnelUrl = match[0];
        try { fs.writeFileSync(tunnelFile, currentTunnelUrl, 'utf8'); } catch (e) {}
        console.log('\n============================================================');
        console.log('🚀 تم تشغيل رابط المندوب السريع والآمن للجوال (HTTPS):');
        console.log('   ' + currentTunnelUrl + '/driver');
        console.log('📡 رابط المندوب على شبكة الواي فاي المحلية:');
        console.log('   http://' + getLocalIp() + ':' + port + '/driver');
        console.log('============================================================\n');
      }
    };

    tunnelProcess.stdout.on('data', handleData);
    tunnelProcess.stderr.on('data', handleData);

    tunnelProcess.on('error', (err) => {
      console.warn('⚠️ تنبيه: تعذر تشغيل cloudflared:', err.message);
    });

    tunnelProcess.on('exit', () => {
      tunnelProcess = null;
    });

    process.on('exit', () => {
      if (tunnelProcess) {
        try { tunnelProcess.kill(); } catch (e) {}
      }
    });
  } catch (err) {
    console.warn('⚠️ خطأ في بدء النفق:', err.message);
  }
}

function getTunnelInfo(port = 5000) {
  const localIp = getLocalIp();
  const tunnelUrl = getSavedTunnelUrl();
  const localDriverUrl = 'http://' + localIp + ':' + port + '/driver';
  const tunnelDriverUrl = tunnelUrl ? tunnelUrl + '/driver' : null;
  const bestDriverUrl = tunnelDriverUrl || localDriverUrl;

  return {
    localIp,
    port,
    tunnelUrl,
    tunnelDriverUrl,
    localDriverUrl,
    bestDriverUrl,
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(bestDriverUrl)
  };
}

module.exports = {
  getLocalIp,
  startTunnel,
  getTunnelInfo
};
