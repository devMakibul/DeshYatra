document.addEventListener('DOMContentLoaded', function () {
  const loginButton = document.getElementById('loginButton');
  const loginDropdown = document.getElementById('loginDropdown');
  const mobileLoginButton = document.getElementById('mobileLoginButton');
  const mobileLoginDropdown = document.getElementById('mobileLoginDropdown');

  // Desktop Login Dropdown Logic
  if (loginButton && loginDropdown) {
    loginButton.addEventListener('click', function () {
      loginDropdown.classList.toggle('hidden');
    });
  }

  // Mobile Login Dropdown Logic
  if (mobileLoginButton && mobileLoginDropdown) {
    mobileLoginButton.addEventListener('click', function () {
      mobileLoginDropdown.classList.toggle('hidden');
    });
  }

  // Close all dropdowns if the user clicks outside of them
  document.addEventListener('click', function (event) {
    // Desktop dropdown close
    if (loginButton && loginDropdown && !loginButton.contains(event.target) && !loginDropdown.contains(event.target)) {
      loginDropdown.classList.add('hidden');
    }
    // Mobile dropdown close
    if (mobileLoginButton && mobileLoginDropdown && !mobileLoginButton.contains(event.target) && !mobileLoginDropdown.contains(event.target)) {
      mobileLoginDropdown.classList.add('hidden');
    }
  });
});

document.getElementById('quickForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const board = document.getElementById('boarding').value.trim();
  const dest = document.getElementById('destination').value.trim();
  const date = document.getElementById('date').value;
  if (!board || !dest || !date) { alert('Please fill all fields'); return; }
  // Pass params via querystring to travel page
  const qs = new URLSearchParams({ board, dest, date });
  location.href = '/travel/?' + qs.toString();
});


function showLoading(input) {
  input.parentNode.classList.add('loading');
}

function hideLoading(input) {
  input.parentNode.classList.remove('loading');
}

function initAutocomplete() {
  const boardingInput = document.getElementById('boarding');
  const destinationInput = document.getElementById('destination');

  const boardingAutocomplete = new google.maps.places.Autocomplete(boardingInput);
  const destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput);

  boardingInput.addEventListener('input', () => {
    showLoading(boardingInput);
  });
  boardingAutocomplete.addListener('place_changed', () => {
    hideLoading(boardingInput);
  });

  destinationInput.addEventListener('input', () => {
    showLoading(destinationInput);
  });
  destinationAutocomplete.addListener('place_changed', () => {
    hideLoading(destinationInput);
  });
}


// Attach the initialization function to the window load event
window.addEventListener('load', initAutocomplete);

document.addEventListener('DOMContentLoaded', () => {
  const checkGoogTeCombo = setInterval(() => {
    const googTeCombo = document.querySelector(".goog-te-combo");
    const noLangsLoaded = document.getElementById("no-langs-loaded");

    if (googTeCombo) {
      // If the element is found, hide the 'no-langs-loaded' element
      if (noLangsLoaded) {
        noLangsLoaded.style.display = "none";
      }
      // Stop checking once the element is found
      clearInterval(checkGoogTeCombo);
    }
  }, 100); // 100 ms interval

});



////////////// Google Translate ///////////////

(function () {
  const indianLanguages = [
    "en", "as", "awa", "bn", "bho", "doi", "gu", "hi", "kn", "kha", "trp", "kok", "mai", "ml",
    "mr", "mwr", "mni-Mtei", "lus", "ne", "or", "pa", "sa", "sat", "sd", "ta", "te", "tcy", "ur"
  ];

  // native names for Indian + English (used for top block / Indian list)
  const nativeNames = {
    "en": "English", "hi": "हिन्दी", "bn": "বাংলা", "ta": "தமிழ்", "te": "తెలుగు", "kn": "ಕನ್ನಡ", "ml": "മലയാളം",
    "mr": "मराठी", "gu": "ગુજરાતी", "pa": "ਪੰਜਾਬੀ", "or": "ଓଡ଼ିଆ", "ur": "اردو", "as": "অসমীয়া", "mai": "मैथिली",
    "ne": "नेपाली", "sd": "سنڌي", "sa": "संस्कृतम्", "doi": "डोगरी", "mni-Mtei": "ꯃꯩꯇꯩꯂꯣꯟ", "awa": "अवधी",
    "bho": "भोजपुरी", "mwr": "मारवाड़ी", "sat": "ᱥᱟᱱᱛᱟᱲᱤ", "lus": "Mizo", "tcy": "ತುಳು", "kok": "कोंकणी",
    "kha": "Khasi", "trp": "Kokborok"
  };

  const root = document.getElementById('customTranslateRoot');
  const toggle = document.getElementById('translateToggle');
  const dropdown = document.getElementById('translateDropdown');
  const langList = document.getElementById('langList');
  const search = document.getElementById('langSearch');
  const currentText = document.getElementById('currentText');
  const currentCodeEl = document.getElementById('currentCode');

  // Try to get native name using Intl.DisplayNames (endonym), fallback to given englishName
  function getNativeName(code, englishName) {
    if (nativeNames[code]) return nativeNames[code];
    try {
      const base = String(code).split(/[-_]/)[0];
      if (typeof Intl !== 'undefined' && Intl.DisplayNames) {
        try {
          const dn = new Intl.DisplayNames([base], { type: 'language' });
          const out = dn.of(code) || dn.of(base);
          if (out) return out;
        } catch (e) {
          const dn2 = new Intl.DisplayNames(['en'], { type: 'language' });
          const out2 = dn2.of(code) || dn2.of(base);
          if (out2) return out2;
        }
      }
    } catch (e) { }
    return englishName;
  }

  function setCurrentLanguageDisplay(code, englishName) {
    const native = getNativeName(code, englishName);
    // show both english and native (native in parentheses)
    currentText.textContent = `${englishName}`;
    currentCodeEl.textContent = code;
  }

  // Reset translation: try select reset, clear cookie, then reload to fully restore original content
  function resetTranslation(select) {
    // set display immediately to original page language
    const pageLang = (document.documentElement.lang || 'en').toLowerCase();
    // figure englishName for pageLang if available
    const optForPage = [...select.options].find(o => o.value === pageLang);
    const englishName = optForPage ? optForPage.text : pageLang;
    setCurrentLanguageDisplay(pageLang, englishName);

    // attempt to set select to its empty option if present
    const emptyOpt = [...select.options].find(o => !o.value || o.value.trim() === '');
    if (emptyOpt) {
      select.value = emptyOpt.value;
      select.dispatchEvent(new Event('change'));
      // also clear cookie
      try { document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"; } catch (e) { }
      // reload to ensure fully un-translated
      setTimeout(() => location.reload(), 100);
      return;
    }

    // if no explicit empty option, try clearing googtrans cookie then reload
    try {
      // try multiple cookie variants to be safe
      document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "googtrans=/; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch (e) { }

    setTimeout(() => location.reload(), 150);
  }

  // Escapes strings for safe HTML insertion
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }

  // Build a clickable row for a select option
  function makeRow(opt, select, extraClass) {
    const code = opt.value;
    const englishName = opt.text;
    const native = (indianLanguages.includes(code) && nativeNames[code]) ? nativeNames[code] : getNativeName(code, englishName);
    const displayText = `${englishName} (${native})`;
    const li = document.createElement('li');
    if (extraClass) li.className = extraClass;
    li.setAttribute('role', 'option');
    li.innerHTML = `<span class="lang-name">${escapeHtml(displayText)}</span><span class="lang-code">${escapeHtml(code)}</span>`;
    li.dataset.value = code;
    li.addEventListener('click', () => {
      select.value = code;
      select.dispatchEvent(new Event('change'));
      setCurrentLanguageDisplay(code, englishName);
      hideDropdown();
    });
    return li;
  }

  // show/hide helpers
  function showDropdown() { dropdown.classList.remove('hidden'); toggle.setAttribute('aria-expanded', 'true'); search.focus(); }
  function hideDropdown() { dropdown.classList.add('hidden'); toggle.setAttribute('aria-expanded', 'false'); }

  // wait for google translate select injection
  const waitInterval = setInterval(() => {
    const select = document.querySelector('.goog-te-combo');
    if (!select || !select.options || select.options.length === 0) return;
    clearInterval(waitInterval);

    // add Default (reset) row at very top
    const pageLang = (document.documentElement.lang || 'en').toLowerCase();
    // determine english label for pageLang
    const pageOpt = [...select.options].find(o => o.value === pageLang);
    const pageEnglishName = pageOpt ? pageOpt.text : pageLang;
    const pageNative = getNativeName(pageLang, pageEnglishName);
    const defaultLabel = `Default`;

    const defaultLi = document.createElement('li');
    defaultLi.className = 'default-row';
    defaultLi.setAttribute('role', 'option');
    defaultLi.innerHTML = `<span class="lang-name"><svg class="reset-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M12 6V3L8 7l4 4V8c2.8 0 5 2.2 5 5 0 2.8-2.2 5-5 5s-5-2.2-5-5H5c0 4.4 3.6 8 8 8s8-3.6 8-8c0-4.4-3.6-8-8-8z" fill="#666"/></svg>${escapeHtml(defaultLabel)}</span><span class="lang-code">${escapeHtml(pageLang)}</span>`;
    defaultLi.addEventListener('click', () => {
      resetTranslation(select);
      hideDropdown();
    });
    langList.appendChild(defaultLi);

    // Add the Indian list (in order), only if present in select options
    indianLanguages.forEach(code => {
      const opt = [...select.options].find(o => o.value === code);
      if (opt) {
        const row = makeRow(opt, select);
        langList.appendChild(row);
      }
    });

    // separator
    const sep = document.createElement('li');
    sep.className = 'separator';
    langList.appendChild(sep);

    // add all remaining languages excluding the Indian set
    [...select.options].forEach(opt => {
      if (!opt.value) return;
      if (indianLanguages.includes(opt.value)) return;
      const row = makeRow(opt, select);
      langList.appendChild(row);
    });

    // Initialize current display from the select value, or fallback to page lang / en
    // Utility: read a cookie
    function getCookie(name) {
      const value = "; " + document.cookie;
      const parts = value.split("; " + name + "=");
      if (parts.length === 2) return parts.pop().split(";").shift();
      return null;
    }

    // Determine initial language
    let initCode = 'en';
    const gtCookie = getCookie('googtrans'); // e.g., "/en/es"
    if (gtCookie && gtCookie.includes('/')) {
      const parts = gtCookie.split('/');
      if (parts.length === 3) initCode = parts[2]; // targetLang
    } else if (select.value && select.value.trim()) {
      initCode = select.value.trim();
    } else if (document.documentElement.lang) {
      initCode = document.documentElement.lang;
    }

    // make sure initCode exists in select options
    if (![...select.options].some(o => o.value === initCode)) {
      initCode = [...select.options].some(o => o.value === 'en') ? 'en' : select.options[0].value;
    }

    const initOpt = [...select.options].find(o => o.value === initCode) || select.options[0];
    setCurrentLanguageDisplay(initOpt.value, initOpt.text);


    // Update current display if the underlying select changes elsewhere
    select.addEventListener('change', () => {
      const code = select.value;
      const opt = [...select.options].find(o => o.value === code) || select.options[select.selectedIndex];
      if (opt) setCurrentLanguageDisplay(opt.value, opt.text);
    });

    // UI interactions
    toggle.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.contains('hidden') ? showDropdown() : hideDropdown(); });
    document.addEventListener('click', (e) => { if (!dropdown.contains(e.target) && !toggle.contains(e.target)) hideDropdown(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideDropdown(); });

    // search filtering
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      [...langList.children].forEach(li => {
        if (li.classList.contains('separator')) return;
        // keep default row visible when query is empty or matches
        const name = li.querySelector('.lang-name')?.textContent?.toLowerCase() || '';
        const code = li.querySelector('.lang-code')?.textContent?.toLowerCase() || '';
        li.style.display = (!q || name.includes(q) || code.includes(q)) ? '' : 'none';
      });
    });

  }, 300);
})();
