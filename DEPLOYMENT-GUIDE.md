# 🚀 Deployment Guide - MWASTECH TECHNOLOGIES Website

## Quick Deployment Options

### 1. Netlify (Recommended - FREE)
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the entire `mwastech-website-bundle` folder onto the page
3. Your site will be live instantly with a URL like `https://amazing-name-123456.netlify.app`
4. Optional: Add custom domain in Site settings

### 2. Vercel (FREE)
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Upload the folder or connect to GitHub
4. Deploy automatically

### 3. GitHub Pages (FREE)
1. Create a GitHub account
2. Create a new repository named `mwastech-website`
3. Upload all files to the repository
4. Go to Settings > Pages
5. Select "Deploy from a branch" and choose "main"
6. Your site will be live at `https://username.github.io/mwastech-website`

### 4. Firebase Hosting (FREE)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run `firebase login`
3. Run `firebase init hosting`
4. Select the bundle folder as public directory
5. Run `firebase deploy`

### 5. Traditional Web Hosting (Paid)
**For cPanel/WHM hosting:**
1. Log into your cPanel
2. Open File Manager
3. Navigate to `public_html` folder
4. Upload all files from the bundle
5. Extract if needed
6. Visit your domain

**For FTP hosting:**
1. Use FileZilla or similar FTP client
2. Connect to your hosting server
3. Upload all files to the root directory (usually `public_html` or `www`)
4. Ensure file permissions are correct (644 for files, 755 for folders)

## Domain Setup

### Connecting Custom Domain
1. **Purchase domain** from registrar (GoDaddy, Namecheap, etc.)
2. **DNS Configuration:**
   - For Netlify: Add CNAME record pointing to your Netlify URL
   - For GitHub Pages: Add CNAME record pointing to `username.github.io`
   - For traditional hosting: Point A record to hosting IP

### Recommended Domain Names
- `mwastechvending.com`
- `mwastech.co.ke` (if Kenya-based)
- `mwastechnologies.com`

## SSL Certificate
- **Free options**: Netlify, Vercel, GitHub Pages include SSL
- **Traditional hosting**: Use Let's Encrypt or hosting provider SSL

## Performance Optimization

### Image Optimization (Already Done)
✅ Images are optimized for web  
✅ Lazy loading implemented  
✅ Proper image formats used  

### Speed Improvements
✅ Minified CSS and JavaScript  
✅ Optimized fonts loading  
✅ Efficient file structure  

## SEO Setup

### Google Search Console
1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add your domain
3. Verify ownership (HTML file method)
4. Submit sitemap

### Google Analytics
1. Create account at [analytics.google.com](https://analytics.google.com)
2. Add tracking code to `index.html` before `</head>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Google My Business
1. Create/claim your business listing
2. Add website URL
3. Include contact information
4. Add business photos

## Email Setup

### Contact Form Backend
The current forms are frontend-only. To receive emails:

**Option 1: Netlify Forms (Free)**
1. Add `netlify` attribute to forms in `index.html`
2. Forms will be submitted to Netlify dashboard

**Option 2: Formspree (Free tier)**
1. Sign up at [formspree.io](https://formspree.io)
2. Update form action URLs

**Option 3: EmailJS (Free tier)**
1. Sign up at [emailjs.com](https://emailjs.com)
2. Add EmailJS script to website

## Social Media Integration

### Meta Tags (Already Added)
✅ Open Graph tags for Facebook sharing  
✅ Twitter Card tags  
✅ Proper meta descriptions  

### Social Media Links
Add to footer or header:
```html
<a href="https://facebook.com/mwastech">Facebook</a>
<a href="https://twitter.com/mwastech">Twitter</a>
<a href="https://linkedin.com/company/mwastech">LinkedIn</a>
```

## Backup & Maintenance

### Regular Backups
- Download website files monthly
- Keep backup of original images
- Document any customizations

### Updates
- Update contact information as needed
- Add new products by copying existing product cards
- Refresh images periodically

## Security

### Basic Security Headers
Add to `.htaccess` file (for Apache servers):
```apache
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

### Content Security Policy
Add to `index.html` in `<head>`:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com;">
```

## Monitoring

### Uptime Monitoring
- Use services like Uptime Robot (free)
- Set up alerts for downtime

### Performance Monitoring
- Google PageSpeed Insights
- GTmetrix for detailed analysis

## Support

For technical issues:
1. Check browser console for errors
2. Verify all files uploaded correctly
3. Check file permissions on server
4. Ensure proper directory structure

---

**Need Help?** Contact your web development team for technical support.
