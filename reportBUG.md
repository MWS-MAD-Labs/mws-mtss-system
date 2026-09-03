Ada bug SSO baru. Tolong investigate dan fix root cause-nya. Gunakan minim token, jangan banyak penjelasan.
Flow yang terjadi:
1. Dari MWS Hub:
[https://app.mws.web.id/support-hub](https://app.mws.web.id/support-hub)
Hub terlihat normal dan user sudah login.
2. Klik MTSS dari Hub.
MTSS terbuka, tetapi langsung menampilkan error:
   "MTSS could not reach Central/Data Center to confirm your profile.
Please try again in a moment or contact IT if it repeats."
3. Namun kalau saya masuk ke MTSS secara langsung dan klik "Continue with Google", MTSS redirect ke:
   [http://localhost:5175/login?redirect=%2Fapps%2Fmtss%2Flaunch](http://localhost:5175/login?redirect=%2Fapps%2Fmtss%2Flaunch)
   Artinya MTSS mengarahkan authentication ke MWS Hub.
4. Setelah login di Hub, Hub terlihat normal.
Kemudian MTSS bisa dibuka dan berhasil masuk.
Ini menunjukkan SSO flow tidak konsisten:
- Launch MTSS dari Hub → central profile lookup gagal.
- Login MTSS → redirect ke Hub → login → launch MTSS → berhasil.
Tolong trace end-to-end:
Hub login/session → Hub MTSS launcher → SSO token/credential → MTSS auth → Central/Data Center lookup.
Fokus cek:
- Apakah Hub mengirim credential/token yang benar saat launch MTSS.
- Apakah MTSS menerima token yang sama antara direct-login flow dan Hub-launch flow.
- Cookie/session/SSO state.
- redirect /apps/mtss/launch.
- Central lookup request dan identity yang dikirim.
- email/userId/unitId mismatch.
- Apakah Hub launch menggunakan stale/invalid token.
- Kenapa direct Google → Hub → MTSS berhasil tetapi Hub → MTSS langsung gagal.
Expected:
- User yang sudah authenticated di Hub harus bisa klik MTSS dan langsung masuk tanpa error.
- Direct MTSS → Continue with Google → Hub → MTSS harus menghasilkan authentication state yang sama.
- Jangan suppress/hide error. Fix root cause dengan perubahan seminimal mungkin.
Workflow:
TRACE → ROOT CAUSE → MINIMAL FIX → TEST kedua flow di atas.
Output singkat saja. Minim token.


anda bisa akses ke sini 
/Downloads/mws-hub$
~/Downloads/mws-central-database-user/
mtss dan juga daily chekin yaa
