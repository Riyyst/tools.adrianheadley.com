(() => {
  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch (_) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch (_) {}
    }
  };

  const applyTextSize = (size) => {
    const scale = size === 'xlarge' ? 1.25 : size === 'large' ? 1.125 : 1;
    document.documentElement.style.fontSize = `${16 * scale}px`;
    document.querySelectorAll('[data-text-size]').forEach((button) => {
      button.classList.toggle('active', button.dataset.textSize === size);
    });
  };

  const applyColourMode = (mode) => {
    document.body.classList.toggle('cb-mode', mode === 'cb');
    document.querySelectorAll('[data-color-mode]').forEach((button) => {
      button.classList.toggle('active', button.dataset.colorMode === mode);
    });
  };

  const applyToggle = (id, className, enabled) => {
    document.body.classList.toggle(className, enabled);
    const input = document.getElementById(id);
    if (input) input.checked = enabled;
  };


  const cleanGlobalNavigation = () => {
    document.querySelectorAll('.tools-global-nav a').forEach((link) => {
      const label = (link.textContent || '').trim().toLowerCase();
      const href = (link.getAttribute('href') || '').toLowerCase();
      if (
        label === 'home' ||
        label === 'powerful websites' ||
        href.includes('home.html') ||
        href.includes('powerful-sites') ||
        href.includes('powerful_sites')
      ) {
        link.remove();
      }
    });
  };



  const TOOL_HELP = {
  "ascii-art.html": {
    "description": "Turn text or an image into ASCII-style artwork directly in your browser.",
    "steps": [
      "Choose whether you want to create art from text or an image.",
      "Enter your text or upload an image, then adjust the available style and sizing controls.",
      "Generate the result and copy or save the finished ASCII art."
    ]
  },
  "barcode-generator.html": {
    "description": "Create a simple barcode from a number or code without uploading anything.",
    "steps": [
      "Enter the number or value you want to encode.",
      "Generate the barcode and check the preview.",
      "Download or use the generated barcode where needed."
    ]
  },
  "colour-picker.html": {
    "description": "Pick colours from an uploaded image or, where supported, directly from your screen.",
    "steps": [
      "Choose image upload or screen colour picking.",
      "Click the colour you want to inspect.",
      "Copy the colour value you need, such as HEX or RGB."
    ]
  },
  "date-difference.html": {
    "description": "Calculate the exact amount of time between two dates or moments.",
    "steps": [
      "Enter the starting date and time.",
      "Enter the ending date and time.",
      "Review the calculated difference in the available time units."
    ]
  },
  "encrypt-decrypt.html": {
    "description": "Encode, encrypt and decrypt text locally using browser-based cryptography.",
    "steps": [
      "Choose the operation you want to perform.",
      "Enter or paste your text and, where required, provide the key or password.",
      "Run the operation, then copy the resulting text or decrypted content."
    ]
  },
  "fake-information-generator.html": {
    "description": "Generate realistic-looking placeholder identity information for testing, demos and mock-ups.",
    "steps": [
      "Choose any available options for the type of information you need.",
      "Generate a placeholder identity.",
      "Copy individual fields or regenerate until you have suitable test data."
    ]
  },
  "file-compressor.html": {
    "description": "Reduce the size of supported files directly in your browser.",
    "steps": [
      "Choose or drag in the file you want to compress.",
      "Select the available compression or quality settings.",
      "Compress the file, review the result and download the smaller version."
    ]
  },
  "file-converter.html": {
    "description": "Convert supported files between common formats without sending them to a remote editor.",
    "steps": [
      "Upload the file you want to convert.",
      "Choose the output format and any available options.",
      "Run the conversion and download the converted file."
    ]
  },
  "find-and-replace.html": {
    "description": "Search through text and replace matching words, phrases or characters quickly.",
    "steps": [
      "Paste or type the text you want to edit.",
      "Enter what you want to find and what should replace it.",
      "Run the replacement, review the result and copy the updated text."
    ]
  },
  "hashing.html": {
    "description": "Create hashes for text or files and compare hashes to check whether content matches.",
    "steps": [
      "Choose whether you want to hash text, a file or multiple files.",
      "Select the available hashing method and provide the content.",
      "Generate the hash, then copy it or use the comparison tools as needed."
    ]
  },
  "image-resizer.html": {
    "description": "Resize an image to new dimensions while keeping the work in your browser.",
    "steps": [
      "Upload the image you want to resize.",
      "Enter the target width and height or use the available sizing options.",
      "Resize the image, preview it and download the result."
    ]
  },
  "merge-pdfs.html": {
    "description": "Combine multiple PDF files into one PDF in the order you choose.",
    "steps": [
      "Add the PDF files you want to combine.",
      "Arrange them in the order you want them to appear.",
      "Merge the files and download the finished PDF."
    ]
  },
  "metadata-reader.html": {
    "description": "Read available EXIF, IPTC and XMP metadata from supported files locally.",
    "steps": [
      "Upload the file you want to inspect.",
      "Wait for the metadata to be read.",
      "Review the available fields and copy any information you need."
    ]
  },
  "metadata-remover.html": {
    "description": "Remove or edit metadata such as EXIF details, GPS information and device data.",
    "steps": [
      "Upload the file whose metadata you want to change.",
      "Choose what to remove, replace or add.",
      "Apply the changes and download the cleaned or updated file."
    ]
  },
  "ocr-reader.html": {
    "description": "Extract readable text from images or PDFs and, where available, create searchable documents.",
    "steps": [
      "Upload an image or PDF containing text.",
      "Run the text recognition process.",
      "Review or copy the extracted text, or download the searchable output if offered."
    ]
  },
  "pdf-separator.html": {
    "description": "Split a PDF into separate page files directly in your browser.",
    "steps": [
      "Upload the PDF you want to separate.",
      "Choose the pages or splitting option you need.",
      "Run the split and download the resulting PDF files."
    ]
  },
  "powerful-sites.html": {
    "description": "Browse a curated collection of useful websites, online tools and resources.",
    "steps": [
      "Browse the listed resources or use any available filtering options.",
      "Open a card to learn what the website is useful for.",
      "Follow the link to visit the resource in a new tab."
    ]
  },
  "qr-code-generator.html": {
    "description": "Create a custom QR code for a link or other supported content.",
    "steps": [
      "Enter the link or information you want the QR code to contain.",
      "Adjust colours, shapes and the optional logo if required.",
      "Generate the QR code, test it and download the image."
    ]
  },
  "random-spinner.html": {
    "description": "Choose a random result from your own list using a weighted spinning wheel.",
    "steps": [
      "Add the choices you want on the wheel.",
      "Adjust weights if some choices should be more or less likely.",
      "Spin the wheel to select a random result."
    ]
  },
  "route-planner.html": {
    "description": "Plan and optimise a route containing multiple stops.",
    "steps": [
      "Enter your starting point and the stops you need to visit.",
      "Add, remove or reorder stops and use optimisation if available.",
      "Review the route and open the directions when you are ready to travel."
    ]
  },
  "steganography.html": {
    "description": "Hide, reveal or remove concealed information in supported text, image, video or file formats.",
    "steps": [
      "Choose whether you want to hide, reveal or remove hidden information.",
      "Add the source file or text and enter the information required by that mode.",
      "Run the operation and save or copy the result."
    ]
  },
  "teleprompter.html": {
    "description": "Display scrolling script text over a camera or shared-screen preview for presenting or recording.",
    "steps": [
      "Type or paste your script into the teleprompter.",
      "Choose your camera or screen background and adjust speed, size and display settings.",
      "Start the prompt and, if needed, record your presentation locally."
    ]
  },
  "temp-email.html": {
    "description": "Create a temporary receive-only email address for short-term sign-ups or testing.",
    "steps": [
      "Generate a temporary email address.",
      "Copy the address and use it where needed.",
      "Return to the inbox to read messages that arrive during the session."
    ]
  },
  "text-case-converter.html": {
    "description": "Change text between uppercase, lowercase, title case, sentence case and other common formats.",
    "steps": [
      "Paste or type your text, or import a supported document.",
      "Choose the case style you want.",
      "Copy the converted text or download the result where available."
    ]
  },
  "text-difference.html": {
    "description": "Compare two pieces of text and highlight what has been added, removed or changed.",
    "steps": [
      "Paste the original text into the first box.",
      "Paste the revised text into the second box.",
      "Run the comparison and review the highlighted differences."
    ]
  },
  "time-zone-converter.html": {
    "description": "Convert a date and time from one time zone into another.",
    "steps": [
      "Choose the source date, time and time zone.",
      "Choose the destination time zone.",
      "Review the converted local time."
    ]
  },
  "typing-speed-test.html": {
    "description": "Measure typing speed and accuracy using generated passages and live feedback.",
    "steps": [
      "Choose your difficulty or passage length.",
      "Start typing the displayed text as accurately as possible.",
      "Finish the test and review your speed, accuracy and other statistics."
    ]
  },
  "unit-converter.html": {
    "description": "Convert a value between compatible measurement units.",
    "steps": [
      "Enter the value you want to convert.",
      "Choose the source and destination units.",
      "Read or copy the converted result."
    ]
  },
  "url-lengthener.html": {
    "description": "Create a deliberately longer version of a URL for testing or novelty use.",
    "steps": [
      "Paste the URL you want to lengthen.",
      "Run the lengthening tool.",
      "Copy the resulting URL."
    ]
  },
  "url-shortener.html": {
    "description": "Create a shorter version of a long web address.",
    "steps": [
      "Paste the URL you want to shorten.",
      "Run the shortening tool.",
      "Copy the shortened link."
    ]
  },
  "video-editor.html": {
    "description": "Edit video, images, text and audio on a multi-track timeline directly in your browser.",
    "steps": [
      "Add your video, images and audio to the media library, then place them on the timeline.",
      "Trim, split, move and resize clips, and add text, backgrounds, transitions or audio adjustments.",
      "Preview the edit, save the project if needed, then export in your chosen supported video format."
    ]
  },
  "word-character-counter.html": {
    "description": "Count words, characters, lines, sentences and other writing statistics as you type.",
    "steps": [
      "Paste or type your text into the editor.",
      "Review the live counts and reading or speaking estimates.",
      "Edit the text as needed and copy the final version."
    ]
  }
};

  const initToolHelp = () => {
    const fileName = (location.pathname.split('/').pop() || '').toLowerCase();
    const isToolPage = location.pathname.toLowerCase().includes('/toolpages/') || !!TOOL_HELP[fileName];
    if (!isToolPage) return;

    const heading = document.querySelector('main h1, .intro h1, h1');
    if (!heading || document.querySelector('.tools-help-trigger')) return;

    const introParagraph = document.querySelector('.intro p');
    const fallbackDescription = introParagraph ? introParagraph.textContent.trim() : `Learn what ${heading.textContent.trim()} does and how to use it.`;
    const help = TOOL_HELP[fileName] || {
      description: fallbackDescription,
      steps: [
        'Add or enter the content you want to work with.',
        'Choose the options you need and run the tool.',
        'Review the result, then copy or download it where available.'
      ]
    };

    const headingText = heading.textContent.trim();

    const host = heading.closest('.intro') || heading.parentElement || document.querySelector('main');
    if (host) host.classList.add('tools-help-host');

    const corner = document.createElement('div');
    corner.className = 'tools-help-corner';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'tools-help-trigger';
    trigger.textContent = '?';
    trigger.setAttribute('aria-label', `More about ${headingText}`);
    trigger.setAttribute('title', 'More about this page');

    const triggerLabel = document.createElement('span');
    triggerLabel.className = 'tools-help-trigger-label';
    triggerLabel.textContent = 'More about this page';

    corner.append(trigger, triggerLabel);
    if (host) host.prepend(corner);

    const overlay = document.createElement('div');
    overlay.className = 'tools-help-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <section class="tools-help-panel" role="dialog" aria-modal="true" aria-labelledby="toolsHelpTitle">
        <button class="tools-help-close" type="button" aria-label="Close help">×</button>
        <h2 id="toolsHelpTitle">${headingText}</h2>
        <h3>What is this?</h3>
        <p class="tools-help-description"></p>
        <h3>How to use it</h3>
        <ol class="tools-help-steps"></ol>
      </section>`;

    overlay.querySelector('.tools-help-description').textContent = help.description || fallbackDescription;
    const list = overlay.querySelector('.tools-help-steps');
    (help.steps || []).forEach((step) => {
      const item = document.createElement('li');
      item.textContent = step;
      list.appendChild(item);
    });

    document.body.appendChild(overlay);
    const close = overlay.querySelector('.tools-help-close');
    let previousFocus = null;

    const openHelp = () => {
      previousFocus = document.activeElement;
      overlay.hidden = false;
      document.body.classList.add('tools-help-open');
      requestAnimationFrame(() => close.focus());
    };
    const closeHelp = () => {
      overlay.hidden = true;
      document.body.classList.remove('tools-help-open');
      if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    };

    trigger.addEventListener('click', openHelp);
    close.addEventListener('click', closeHelp);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeHelp();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !overlay.hidden) closeHelp();
    });
  };


  const classifyToolState = (element) => {
    if (!element) return;

    const raw = (element.textContent || '').trim();
    if (!raw) {
      element.removeAttribute('data-tools-state');
      return;
    }

    const text = raw.toLowerCase();
    let type = 'info';

    if (/(copied|complete|completed|ready|success|saved|generated|created|loaded|finished|done)/.test(text)) {
      type = 'success';
    } else if (/(failed|error|could not|couldn't|invalid|unsupported|not supported|unable|network issue|permission denied)/.test(text)) {
      type = 'error';
    } else if (/(choose|select|enter|add at least|nothing|no file|no files|not enough|required|try another|please)/.test(text)) {
      type = 'warning';
    }

    element.classList.add('tools-state');
    element.setAttribute('data-tools-state', type);
  };

  const initToolStateMessages = () => {
    const selectors = [
      '#status',
      '#error',
      '#errors',
      '#feedback',
      '#hint',
      '#edHint',
      '[data-tool-state]'
    ];

    const elements = Array.from(new Set(
      selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)))
    )).filter((element) => !element.classList.contains('tools-state-skip'));

    elements.forEach((element) => {
      classifyToolState(element);

      const observer = new MutationObserver(() => classifyToolState(element));
      observer.observe(element, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });
  };

  const inputHasValue = (element) => {
    if (!element) return false;

    if (element.type === 'file') {
      return Boolean(element.files && element.files.length);
    }

    if (element.type === 'checkbox' || element.type === 'radio') {
      return element.checked;
    }

    if (element.tagName === 'SELECT') {
      return Boolean(element.value && element.value !== '__placeholder__');
    }

    return Boolean(String(element.value || '').trim());
  };

  const setButtonsDisabled = (ids, disabled) => {
    ids.forEach((id) => {
      const button = document.getElementById(id);
      if (!button) return;
      button.disabled = Boolean(disabled);
      button.classList.add('tools-button-ready');
    });
  };

  const pageName = () => {
    const raw = location.pathname.split('/').filter(Boolean).pop() || '';
    return raw.toLowerCase();
  };

  const readinessConfigs = {
    'date-difference.html': [{
      watch: ['diffStart', 'diffEnd'],
      buttons: ['calcDiff'],
      message: 'Choose both dates and times to calculate the difference.',
      ready: () => inputHasValue(document.getElementById('diffStart')) &&
                   inputHasValue(document.getElementById('diffEnd'))
    }],
    'file-compressor.html': [{
      watch: ['fileInput'],
      buttons: ['compressBtn'],
      message: 'Choose a file to begin.',
      ready: () => inputHasValue(document.getElementById('fileInput'))
    }],
    'file-converter.html': [{
      watch: ['fileInput', 'toType'],
      buttons: ['convertBtn'],
      message: 'Choose a file and an output format to begin.',
      ready: () => inputHasValue(document.getElementById('fileInput')) &&
                   inputHasValue(document.getElementById('toType'))
    }],
    'find-and-replace.html': [{
      watch: ['source', 'find'],
      buttons: ['btnFindPrev', 'btnFindNext', 'btnReplace', 'btnReplaceAll'],
      message: 'Enter or load some text, then enter what you want to find.',
      ready: () => inputHasValue(document.getElementById('source')) &&
                   inputHasValue(document.getElementById('find'))
    }],
    'hashing.html': [
      {
        watch: ['textInput'],
        buttons: ['hashText'],
        message: 'Enter text to enable hashing.',
        ready: () => inputHasValue(document.getElementById('textInput'))
      },
      {
        watch: ['oneFile'],
        buttons: ['hashFile'],
        message: '',
        ready: () => inputHasValue(document.getElementById('oneFile'))
      },
      {
        watch: ['manyFiles'],
        buttons: ['hashFiles'],
        message: '',
        ready: () => inputHasValue(document.getElementById('manyFiles'))
      },
      {
        watch: ['cmpA', 'cmpB'],
        buttons: ['compareFiles'],
        message: '',
        ready: () => inputHasValue(document.getElementById('cmpA')) &&
                     inputHasValue(document.getElementById('cmpB'))
      },
      {
        watch: ['dirA', 'dirB'],
        buttons: ['compareFolders'],
        message: '',
        ready: () => inputHasValue(document.getElementById('dirA')) &&
                     inputHasValue(document.getElementById('dirB'))
      }
    ],
    'qr-code-generator.html': [{
      watch: ['qrText'],
      buttons: ['btnDownload', 'btnCopy'],
      message: 'Enter the text or URL for your QR code.',
      ready: () => inputHasValue(document.getElementById('qrText'))
    }],
    'url-lengthener.html': [{
      watch: ['longUrl'],
      buttons: ['lengthen'],
      message: 'Enter a URL to lengthen.',
      ready: () => inputHasValue(document.getElementById('longUrl'))
    }],
    'url-shortener.html': [{
      watch: ['longUrl'],
      buttons: ['shorten'],
      message: 'Enter a URL to shorten.',
      ready: () => inputHasValue(document.getElementById('longUrl'))
    }],
    'unit-converter.html': [{
      watch: ['fromValue', 'fromUnit', 'toUnit'],
      buttons: [],
      message: 'Enter a value and choose the units to convert.',
      ready: () => inputHasValue(document.getElementById('fromValue')) &&
                   inputHasValue(document.getElementById('fromUnit')) &&
                   inputHasValue(document.getElementById('toUnit'))
    }]
  };

  const attachReadinessHint = (config) => {
    if (!config.message) return null;

    const card =
      document.querySelector('.tool .card') ||
      document.querySelector('.tool-card') ||
      document.querySelector('main .card');

    if (!card) return null;

    const hint = document.createElement('div');
    hint.className = 'tools-readiness-hint';
    hint.textContent = config.message;
    hint.setAttribute('aria-live', 'polite');
    card.appendChild(hint);
    return hint;
  };

  const initToolReadiness = () => {
    const configs = readinessConfigs[pageName()];
    if (!configs || !configs.length) return;

    configs.forEach((config, index) => {
      const hint = index === 0 ? attachReadinessHint(config) : null;

      const update = () => {
        let ready = false;
        try {
          ready = Boolean(config.ready());
        } catch {
          ready = false;
        }

        setButtonsDisabled(config.buttons || [], !ready);
        if (hint) hint.hidden = ready;
      };

      (config.watch || []).forEach((id) => {
        const element = document.getElementById(id);
        if (!element) return;
        ['input', 'change'].forEach((eventName) => {
          element.addEventListener(eventName, update);
        });
      });

      update();
    });
  };


  document.addEventListener('DOMContentLoaded', () => {
    cleanGlobalNavigation();
    initToolHelp();
    initToolStateMessages();
    initToolReadiness();
    const button = document.getElementById('a11y-button');
    const panel = document.getElementById('a11y-panel');
    if (!button || !panel) return;

    applyTextSize(storage.get('ah-text-size') || 'normal');
    applyColourMode(storage.get('ah-color-mode') || 'normal');
    applyToggle('underline-toggle', 'links-underlined', storage.get('ah-links') === 'underline');
    applyToggle('motion-toggle', 'reduce-motion', storage.get('ah-motion') === 'reduce');
    applyToggle('focus-toggle', 'strong-focus', storage.get('ah-focus') === 'strong');

    button.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', (event) => {
      if (!panel.contains(event.target) && !button.contains(event.target)) {
        panel.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        panel.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
        button.focus();
      }
    });

    document.querySelectorAll('[data-text-size]').forEach((chip) => {
      chip.addEventListener('click', () => {
        applyTextSize(chip.dataset.textSize);
        storage.set('ah-text-size', chip.dataset.textSize);
      });
    });

    document.querySelectorAll('[data-color-mode]').forEach((chip) => {
      chip.addEventListener('click', () => {
        applyColourMode(chip.dataset.colorMode);
        storage.set('ah-color-mode', chip.dataset.colorMode);
      });
    });

    const bindings = [
      ['underline-toggle', 'links-underlined', 'ah-links', 'underline', 'normal'],
      ['motion-toggle', 'reduce-motion', 'ah-motion', 'reduce', 'normal'],
      ['focus-toggle', 'strong-focus', 'ah-focus', 'strong', 'normal']
    ];

    bindings.forEach(([id, className, key, onValue, offValue]) => {
      const input = document.getElementById(id);
      if (!input) return;
      input.addEventListener('change', () => {
        document.body.classList.toggle(className, input.checked);
        storage.set(key, input.checked ? onValue : offValue);
      });
    });
  });
})();
