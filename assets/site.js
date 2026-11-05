document.documentElement.classList.add('js');

const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    navMenu.classList.toggle('is-open', !isOpen);
  });

  navMenu.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
      navMenu.classList.remove('is-open');
    }
  });
}

const revealObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 })
  : null;

document.querySelectorAll('.reveal').forEach((element) => {
  if (revealObserver) revealObserver.observe(element);
  else element.classList.add('is-visible');
});

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

const journalSearch = document.querySelector('#journal-search');
const journalEntries = [...document.querySelectorAll('[data-journal-entry]')];
const journalCount = document.querySelector('#journal-count');
const journalEmpty = document.querySelector('#journal-empty');
let activeCategory = 'all';

function filterArticles() {
  const query = journalSearch instanceof HTMLInputElement ? journalSearch.value.trim().toLowerCase() : '';
  let visibleCount = 0;

  let publishedCount = 0;
  let plannedCount = 0;
  journalEntries.forEach((card) => {
    const text = card.textContent.toLowerCase();
    const categoryMatches = activeCategory === 'all' || card.dataset.category === activeCategory;
    const searchMatches = !query || text.includes(query) || (card.dataset.tags || '').toLowerCase().includes(query);
    const isVisible = categoryMatches && searchMatches;
    card.hidden = !isVisible;
    if (isVisible) {
      if (card.dataset.entryStatus === 'published') publishedCount += 1;
      else plannedCount += 1;
    }
  });

  if (journalCount instanceof HTMLElement) {
    const publishedLabel = `${publishedCount} ${publishedCount === 1 ? 'article' : 'articles'}`;
    const plannedLabel = plannedCount > 0
      ? `${plannedCount} planned ${plannedCount === 1 ? 'topic' : 'topics'}`
      : '';
    journalCount.textContent = plannedLabel ? `${publishedLabel} · ${plannedLabel}` : publishedLabel;
  }
  if (journalEmpty instanceof HTMLElement) journalEmpty.hidden = publishedCount + plannedCount !== 0;
}

document.querySelectorAll('[data-category-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!(button instanceof HTMLButtonElement)) return;
    activeCategory = button.dataset.categoryFilter || 'all';
    document.querySelectorAll('[data-category-filter]').forEach((filterButton) => {
      filterButton.setAttribute('aria-pressed', String(filterButton === button));
    });
    filterArticles();
  });
});

if (journalSearch instanceof HTMLInputElement) {
  journalSearch.addEventListener('input', filterArticles);
  filterArticles();
}

const contactForm = document.querySelector('[data-contact-form]');
if (contactForm instanceof HTMLFormElement) {
  const status = contactForm.querySelector('.form-status');
  const submitButton = contactForm.querySelector('button[type="submit"]');

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!(status instanceof HTMLElement) || !(submitButton instanceof HTMLButtonElement)) return;

    status.textContent = 'Sending your enquiry…';
    status.dataset.state = 'sending';
    submitButton.disabled = true;

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error(`Enquiry service returned ${response.status}`);
      contactForm.reset();
      status.textContent = 'Thanks, your message has been sent. I’ll be in touch soon.';
      status.dataset.state = 'success';
    } catch (error) {
      console.error('Unable to send contact enquiry:', error);
      status.textContent = 'Your message could not be sent. Please email valeregmbaya@gmail.com instead.';
      status.dataset.state = 'error';
    } finally {
      submitButton.disabled = false;
    }
  });
}

const contrastInputs = [
  document.querySelector('#foreground'),
  document.querySelector('#background')
];
const contrastHexInputs = [
  document.querySelector('#foreground-hex'),
  document.querySelector('#background-hex')
];
const contrastOutput = document.querySelector('#contrast-ratio');
const normalContrastStatus = document.querySelector('#contrast-normal');
const normalContrastResult = document.querySelector('#contrast-normal-result');
const largeContrastStatus = document.querySelector('#contrast-large');
const largeContrastResult = document.querySelector('#contrast-large-result');
const contrastSample = document.querySelector('#contrast-sample');

function getLuminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi);
  if (!channels || channels.length !== 3) return null;
  const rgb = channels.map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * rgb[0]) + (0.7152 * rgb[1]) + (0.0722 * rgb[2]);
}

function updateContrast() {
  const [foreground, background] = contrastInputs;
  const [foregroundHex, backgroundHex] = contrastHexInputs;
  if (!(foreground instanceof HTMLInputElement) || !(background instanceof HTMLInputElement)
    || !(foregroundHex instanceof HTMLInputElement) || !(backgroundHex instanceof HTMLInputElement)
    || !(contrastOutput instanceof HTMLElement) || !(normalContrastStatus instanceof HTMLElement)
    || !(normalContrastResult instanceof HTMLElement) || !(largeContrastStatus instanceof HTMLElement)
    || !(largeContrastResult instanceof HTMLElement)
    || !(contrastSample instanceof HTMLElement)) return;

  const foregroundValue = foregroundHex.value.trim().match(/^#?([a-f\d]{6})$/i);
  const backgroundValue = backgroundHex.value.trim().match(/^#?([a-f\d]{6})$/i);
  const foregroundError = document.querySelector('#foreground-hex-error');
  const backgroundError = document.querySelector('#background-hex-error');
  const foregroundIsValid = foregroundValue !== null;
  const backgroundIsValid = backgroundValue !== null;

  foregroundHex.setAttribute('aria-invalid', String(!foregroundIsValid));
  backgroundHex.setAttribute('aria-invalid', String(!backgroundIsValid));
  if (foregroundError instanceof HTMLElement) foregroundError.hidden = foregroundIsValid;
  if (backgroundError instanceof HTMLElement) backgroundError.hidden = backgroundIsValid;

  if (!foregroundIsValid || !backgroundIsValid) {
    contrastOutput.textContent = '—';
    normalContrastStatus.dataset.state = 'pending';
    largeContrastStatus.dataset.state = 'pending';
    normalContrastResult.textContent = 'Enter valid colors';
    largeContrastResult.textContent = 'Enter valid colors';
    return;
  }

  foreground.value = `#${foregroundValue[1]}`;
  background.value = `#${backgroundValue[1]}`;
  foregroundHex.value = foreground.value.toUpperCase();
  backgroundHex.value = background.value.toUpperCase();

  const foregroundLuminance = getLuminance(foreground.value);
  const backgroundLuminance = getLuminance(background.value);
  if (foregroundLuminance === null || backgroundLuminance === null) return;

  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  const normalPass = ratio >= 4.5;
  const largePass = ratio >= 3;

  contrastOutput.textContent = `${ratio.toFixed(2)}:1`;
  normalContrastResult.textContent = normalPass ? 'Pass' : 'Does not pass';
  largeContrastResult.textContent = largePass ? 'Pass' : 'Does not pass';
  normalContrastStatus.dataset.state = normalPass ? 'pass' : 'fail';
  largeContrastStatus.dataset.state = largePass ? 'pass' : 'fail';
  contrastSample.style.color = foreground.value;
  contrastSample.style.backgroundColor = background.value;
}

contrastInputs.forEach((input, index) => {
  if (input instanceof HTMLInputElement) {
    input.addEventListener('input', () => {
      const hexInput = contrastHexInputs[index];
      if (hexInput instanceof HTMLInputElement) hexInput.value = input.value.toUpperCase();
      updateContrast();
    });
  }
});
contrastHexInputs.forEach((input) => {
  if (input instanceof HTMLInputElement) input.addEventListener('input', updateContrast);
});
if (contrastOutput) updateContrast();

const garden = document.querySelector('[data-signal-garden]');
if (garden instanceof HTMLElement) {
  const gardenSvg = garden.querySelector('.garden-svg');
  const gardenNodesLayer = garden.querySelector('[data-garden-nodes]');
  const gardenLinksLayer = garden.querySelector('[data-garden-links]');
  const gardenStatus = garden.querySelector('[data-garden-status]');
  const gardenSelection = garden.querySelector('[data-garden-selection]');
  const gardenForm = garden.querySelector('[data-garden-form]');
  const gardenNodeFilter = garden.querySelector('[data-garden-node-filter]');
  const gardenLinkFilter = garden.querySelector('[data-garden-link-filter]');
  const gardenShowLinks = garden.querySelector('[data-garden-show-links]');
  const gardenConnectButton = garden.querySelector('[data-garden-connect]');
  const gardenReorganizeButton = garden.querySelector('[data-garden-reorganize]');
  const gardenResetButton = garden.querySelector('[data-garden-reset]');

  if (gardenSvg instanceof SVGSVGElement && gardenNodesLayer instanceof SVGGElement
    && gardenLinksLayer instanceof SVGGElement && gardenStatus instanceof HTMLElement
    && gardenSelection instanceof HTMLElement && gardenForm instanceof HTMLFormElement
    && gardenNodeFilter instanceof HTMLSelectElement && gardenLinkFilter instanceof HTMLSelectElement
    && gardenShowLinks instanceof HTMLInputElement && gardenConnectButton instanceof HTMLButtonElement
    && gardenReorganizeButton instanceof HTMLButtonElement && gardenResetButton instanceof HTMLButtonElement) {
    const initialNodes = [
      { id: 'what-if', label: 'What if?', kind: 'question', x: 400, y: 270, radius: 17 },
      { id: 'look-closer', label: 'Look closer', kind: 'idea', x: 250, y: 165, radius: 15 },
      { id: 'small-signal', label: 'Small signal', kind: 'signal', x: 400, y: 85, radius: 14 },
      { id: 'new-context', label: 'New context', kind: 'idea', x: 565, y: 175, radius: 16 },
      { id: 'try-again', label: 'Try again', kind: 'signal', x: 615, y: 365, radius: 15 },
      { id: 'unexpected', label: 'Unexpected', kind: 'idea', x: 445, y: 490, radius: 17 },
      { id: 'first-note', label: 'First note', kind: 'signal', x: 210, y: 400, radius: 14 },
      { id: 'ask-why', label: 'Ask why', kind: 'question', x: 145, y: 280, radius: 16 }
    ];
    const initialLinks = [
      { from: 'what-if', to: 'look-closer', strength: 3 },
      { from: 'what-if', to: 'small-signal', strength: 2 },
      { from: 'what-if', to: 'new-context', strength: 3 },
      { from: 'what-if', to: 'unexpected', strength: 2 },
      { from: 'what-if', to: 'ask-why', strength: 3 },
      { from: 'look-closer', to: 'small-signal', strength: 1 },
      { from: 'look-closer', to: 'first-note', strength: 2 },
      { from: 'new-context', to: 'try-again', strength: 2 },
      { from: 'new-context', to: 'small-signal', strength: 1 },
      { from: 'try-again', to: 'unexpected', strength: 2 },
      { from: 'first-note', to: 'ask-why', strength: 1 },
      { from: 'first-note', to: 'unexpected', strength: 1 }
    ];
    const nodeKindNames = { idea: 'Idea', question: 'Question', signal: 'Signal' };
    const cloneNodes = () => initialNodes.map((node) => ({ ...node }));
    let nodes = cloneNodes();
    let links = initialLinks.map((link) => ({ ...link }));
    let selectedNodeId = null;
    let linkMode = false;
    let dragState = null;
    let nextNodeId = 1;
    let layoutAnimationId = null;

    function setGardenStatus(message) {
      gardenStatus.textContent = message;
    }

    function nodeConnectionCount(nodeId) {
      return links.filter((link) => link.from === nodeId || link.to === nodeId).length;
    }

    function makeSvgElement(name, attributes) {
      const element = document.createElementNS('http://www.w3.org/2000/svg', name);
      Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
      return element;
    }

    function renderGarden() {
      const kindFilter = gardenNodeFilter.value;
      const connectionFilter = gardenLinkFilter.value;
      const visibleNodes = nodes.filter((node) => kindFilter === 'all' || node.kind === kindFilter);
      const visibleIds = new Set(visibleNodes.map((node) => node.id));
      const visibleLinks = gardenShowLinks.checked
        ? links.filter((link) => {
            const from = nodes.find((node) => node.id === link.from);
            const to = nodes.find((node) => node.id === link.to);
            if (!from || !to || !visibleIds.has(from.id) || !visibleIds.has(to.id)) return false;
            if (connectionFilter === 'strong') return link.strength >= 2;
            if (connectionFilter === 'cross') return from.kind !== to.kind;
            return true;
          })
        : [];

      if (selectedNodeId && !visibleIds.has(selectedNodeId)) selectedNodeId = null;
      gardenNodesLayer.replaceChildren();
      gardenLinksLayer.replaceChildren();

      visibleLinks.forEach((link) => {
        const from = nodes.find((node) => node.id === link.from);
        const to = nodes.find((node) => node.id === link.to);
        if (!from || !to) return;
        const isHighlighted = selectedNodeId === from.id || selectedNodeId === to.id;
        gardenLinksLayer.append(makeSvgElement('line', {
          class: `garden-link${isHighlighted ? ' is-highlighted' : ''}`,
          x1: from.x, y1: from.y, x2: to.x, y2: to.y,
          'data-strength': link.strength
        }));
      });

      visibleNodes.forEach((node) => {
        const group = makeSvgElement('g', {
          class: `garden-node${selectedNodeId === node.id ? ' is-selected' : ''}`,
          'data-node-id': node.id,
          'data-kind': node.kind,
          role: 'button',
          tabindex: 0,
          'aria-label': `${node.label}. ${nodeKindNames[node.kind]}. ${nodeConnectionCount(node.id)} connections.`,
          'aria-pressed': selectedNodeId === node.id
        });
        const labelOnLeft = node.x > 610;
        const label = makeSvgElement('text', {
          class: 'garden-node-label',
          x: node.x + (labelOnLeft ? -node.radius - 9 : node.radius + 9),
          y: node.y + 4,
          'text-anchor': labelOnLeft ? 'end' : 'start'
        });
        label.textContent = node.label;
        group.append(
          makeSvgElement('circle', { class: 'garden-node-halo', cx: node.x, cy: node.y, r: node.radius + 10 }),
          makeSvgElement('circle', { class: 'garden-node-core', cx: node.x, cy: node.y, r: node.radius }),
          makeSvgElement('circle', { class: 'garden-node-ring', cx: node.x, cy: node.y, r: Math.max(3, node.radius - 5) }),
          label
        );
        gardenNodesLayer.append(group);
      });

      garden.querySelectorAll('[data-garden-node-count]').forEach((element) => {
        element.textContent = String(visibleNodes.length);
      });
      garden.querySelectorAll('[data-garden-link-count]').forEach((element) => {
        element.textContent = String(visibleLinks.length);
      });

      const selectedNode = nodes.find((node) => node.id === selectedNodeId);
      gardenSelection.textContent = selectedNode
        ? `${selectedNode.label} · ${nodeConnectionCount(selectedNode.id)} connected ${nodeConnectionCount(selectedNode.id) === 1 ? 'idea' : 'ideas'}.`
        : 'Select a node to explore its connections.';
    }

    function activateGardenNode(nodeId) {
      const node = nodes.find((item) => item.id === nodeId);
      if (!node) return;

      if (!linkMode) {
        selectedNodeId = selectedNodeId === nodeId ? null : nodeId;
        renderGarden();
        if (selectedNodeId) {
          setGardenStatus(`${node.label} is connected to ${nodeConnectionCount(nodeId)} other ${nodeConnectionCount(nodeId) === 1 ? 'idea' : 'ideas'}.`);
        } else {
          setGardenStatus('Drag a node to move it. Choose Connect nodes, then select two points.');
        }
        return;
      }

      if (!selectedNodeId) {
        selectedNodeId = nodeId;
        renderGarden();
        setGardenStatus(`${node.label} selected. Now choose a second node to connect.`);
        return;
      }

      if (selectedNodeId === nodeId) {
        selectedNodeId = null;
        renderGarden();
        setGardenStatus('Choose two different nodes to create a connection.');
        return;
      }

      const alreadyConnected = links.some((link) =>
        (link.from === selectedNodeId && link.to === nodeId)
        || (link.from === nodeId && link.to === selectedNodeId));
      if (alreadyConnected) {
        setGardenStatus('Those nodes are already connected. Choose another node.');
        return;
      }

      links.push({ from: selectedNodeId, to: nodeId, strength: 1 });
      const firstNode = nodes.find((item) => item.id === selectedNodeId);
      const firstLabel = firstNode ? firstNode.label : 'The first node';
      selectedNodeId = null;
      linkMode = false;
      gardenConnectButton.setAttribute('aria-pressed', 'false');
      renderGarden();
      setGardenStatus(`Connected ${firstLabel} and ${node.label}.`);
    }

    function gardenPointFromEvent(event) {
      const matrix = gardenSvg.getScreenCTM();
      if (!matrix) return null;
      const point = gardenSvg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      return point.matrixTransform(matrix.inverse());
    }

    function cancelGardenLayout() {
      if (layoutAnimationId !== null) {
        cancelAnimationFrame(layoutAnimationId);
        layoutAnimationId = null;
      }
    }

    const clarityLab = document.querySelector('[data-clarity-lab]');
    if (clarityLab instanceof HTMLElement) {
      const clarityInput = clarityLab.querySelector('[data-clarity-input]');
      const clarityCount = clarityLab.querySelector('[data-clarity-count]');
      const clarityModeButtons = [...clarityLab.querySelectorAll('[data-clarity-mode]')];
      const clarityTone = clarityLab.querySelector('[data-clarity-tone]');
      const clarityRunButton = clarityLab.querySelector('[data-clarity-run]');
      const clarityClearButton = clarityLab.querySelector('[data-clarity-clear]');
      const clarityExampleButton = clarityLab.querySelector('[data-clarity-example]');
      const clarityOutput = clarityLab.querySelector('[data-clarity-output]');
      const clarityResultMeta = clarityLab.querySelector('[data-clarity-result-meta]');
      const clarityCopyButton = clarityLab.querySelector('[data-clarity-copy]');
      const clarityStatus = clarityLab.querySelector('[data-clarity-status]');

      if (clarityInput instanceof HTMLTextAreaElement && clarityCount instanceof HTMLElement
        && clarityTone instanceof HTMLSelectElement && clarityRunButton instanceof HTMLButtonElement
        && clarityClearButton instanceof HTMLButtonElement && clarityExampleButton instanceof HTMLButtonElement
        && clarityOutput instanceof HTMLElement && clarityResultMeta instanceof HTMLElement
        && clarityCopyButton instanceof HTMLButtonElement && clarityStatus instanceof HTMLElement) {
        const exampleText = 'We are currently experiencing a delay due to the fact that the shipment has not arrived. It is important to note that we will contact you as soon as possible. Please be advised that you may respond to this message if you have any questions.';
        const modeNames = { simplify: 'Simplified', summarize: 'Summary', bullets: 'Bullet points' };
        const toneNames = { clear: 'Clear and simple', warm: 'Warm and friendly', professional: 'Professional' };
        let activeClarityMode = 'simplify';
        let currentClarityResult = '';

        function setClarityStatus(message, state = 'info') {
          clarityStatus.textContent = message;
          clarityStatus.dataset.state = state;
        }

        function setClarityPlaceholder() {
          const placeholder = document.createElement('p');
          placeholder.className = 'clarity-output-placeholder';
          placeholder.textContent = 'Your rewrite will show up here. Choose an option, then make it clearer.';
          clarityOutput.replaceChildren(placeholder);
          clarityResultMeta.textContent = 'Ready when you are';
          clarityCopyButton.disabled = true;
          currentClarityResult = '';
        }

        function replaceWritingPhrases(text, replacements) {
          return replacements.reduce((result, [phrase, replacement]) => {
            const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const matcher = new RegExp(`\\b${escapedPhrase}\\b`, 'gi');
            return result.replace(matcher, (match, offset, original) => {
              if (!replacement) return '';
              const startsSentence = offset === 0 || /[.!?]\s*$/.test(original.slice(0, offset));
              const isAllCaps = match.length > 1 && match === match.toUpperCase();
              const startsUppercase = match[0] !== match[0].toLowerCase()
                && (!isAllCaps || startsSentence);
              return startsUppercase
                ? `${replacement[0].toUpperCase()}${replacement.slice(1)}`
                : replacement;
            });
          }, text);
        }

        function simplifyWriting(text) {
          return replaceWritingPhrases(text, [
            ['at this point in time', 'now'],
            ['due to the fact that', 'because'],
            ['for the purpose of', 'to'],
            ['in order to', 'to'],
            ['with regard to', 'about'],
            ['in the event that', 'if'],
            ['it is important to note that', ''],
            ['please be advised that', ''],
            ['has the ability to', 'can'],
            ['is able to', 'can'],
            ['make a decision', 'decide'],
            ['come to a conclusion', 'conclude'],
            ['provide assistance', 'help'],
            ['approximately', 'about'],
            ['demonstrate', 'show'],
            ['facilitate', 'help'],
            ['individuals', 'people'],
            ['numerous', 'many'],
            ['additional', 'more'],
            ['commence', 'start'],
            ['terminate', 'end'],
            ['prior to', 'before'],
            ['subsequent to', 'after'],
            ['utilize', 'use'],
            ['inquire', 'ask'],
            ['purchase', 'buy'],
            ['require', 'need'],
            ['currently', 'now'],
            ['therefore', 'so'],
            ['however', 'but']
          ]).replace(/[ \t]{2,}/g, ' ')
            .replace(/[ \t]+([,.!?;:])/g, '$1')
            .replace(/([.!?]\s+)([a-z])/g, (_match, boundary, letter) => `${boundary}${letter.toUpperCase()}`)
            .trim();
        }

        function applyClarityTone(text, tone) {
          if (tone === 'professional') {
            return replaceWritingPhrases(text, [
              ["can't", 'cannot'], ["won't", 'will not'], ["don't", 'do not'], ["doesn't", 'does not'],
              ["didn't", 'did not'], ["isn't", 'is not'], ["aren't", 'are not'], ["wasn't", 'was not'],
              ["weren't", 'were not'], ["shouldn't", 'should not'], ["wouldn't", 'would not'],
              ["couldn't", 'could not'], ["it's", 'it is'], ["i'm", 'I am'], ["we're", 'we are'],
              ["they're", 'they are'], ["you're", 'you are'], ["i've", 'I have'], ["we've", 'we have'],
              ["they've", 'they have'], ["you've", 'you have'], ["i'll", 'I will'], ["we'll", 'we will'],
              ["they'll", 'they will'], ["you'll", 'you will'], ['ASAP', 'as soon as possible'],
              ['hey', 'hello'], ['hi', 'hello'], ['thanks for your help', 'thank you for your assistance'],
              ['thanks', 'thank you'],
              ['a lot of', 'many'], ['get back to you', 'respond to you']
            ]);
          }
          if (tone === 'warm') {
            return replaceWritingPhrases(text, [
              ['we will contact you as soon as possible', "we'll be in touch soon"],
              ['you may respond to this message if you have any questions', 'feel free to reply if you have any questions'],
              ['thank you for your assistance', 'thanks for your help'],
              ['we are unable to', "we can't"], ['do not hesitate to', 'feel free to'],
              ['ASAP', 'soon'],
              ['please let me know', 'could you let me know'], ['please send', 'could you send'],
              ['i apologize for', "I'm sorry about"], ['thank you for', 'thanks for'],
              ['thank you', 'thanks'],
              ['cannot', "can't"], ['will not', "won't"], ['do not', "don't"], ['does not', "doesn't"],
              ['did not', "didn't"], ['is not', "isn't"], ['are not', "aren't"], ['should not', "shouldn't"],
              ['would not', "wouldn't"], ['could not', "couldn't"], ['it is', "it's"], ['I am', "I'm"],
              ['we are', "we're"], ['they are', "they're"], ['you are', "you're"], ['I have', "I've"],
              ['we have', "we've"], ['they have', "they've"], ['I will', "I'll"],
              ['we will', "we'll"], ['they will', "they'll"], ['you will', "you'll"],
              ['Please be advised that', 'Just so you know,'], ['Please note that', 'Just so you know,'],
              ['we cannot assist with', "we can't help with"]
            ]);
          }
          return text;
        }

        function getWritingSentences(text) {
          return text.split(/\n+/)
            .flatMap((line) => line.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
            .map((sentence) => sentence.trim().replace(/^[-*•]\s*/, ''))
            .filter(Boolean);
        }

        function summarizeWriting(text) {
          const sentences = getWritingSentences(text);
          if (sentences.length <= 1) return sentences.join(' ');
          const scored = sentences.map((sentence, index) => {
            const words = sentence.match(/\b[\p{L}\p{N}'’-]+\b/gu) || [];
            const signalWords = /\b(need|must|because|therefore|result|important|will|should|goal|problem|solution|change|decide|recommend|risk|deadline|first|finally)\b/i;
            const lengthScore = words.length >= 7 && words.length <= 32 ? 2 : words.length > 45 ? -2 : 0;
            const signalScore = signalWords.test(sentence) ? 2 : 0;
            return { sentence, index, score: lengthScore + signalScore };
          });
          const selected = scored
            .sort((first, second) => second.score - first.score || first.index - second.index)
            .slice(0, Math.min(3, Math.max(1, Math.ceil(sentences.length / 3))))
            .sort((first, second) => first.index - second.index);
          return selected.map((item) => item.sentence).join(' ');
        }

        function renderClarityResult(text, mode) {
          clarityOutput.replaceChildren();
          if (mode === 'bullets') {
            const list = document.createElement('ul');
            list.className = 'clarity-output-list';
            text.split(/\n+/).map((item) => item.trim()).filter(Boolean).forEach((item) => {
              const listItem = document.createElement('li');
              listItem.textContent = item;
              list.append(listItem);
            });
            clarityOutput.append(list);
          } else {
            const paragraph = document.createElement('p');
            paragraph.textContent = text;
            clarityOutput.append(paragraph);
          }
        }

        function runClarityRewrite() {
          const source = clarityInput.value.trim();
          if (!source) {
            setClarityStatus('Add some text first, and the rewrite will appear here.', 'error');
            clarityInput.focus();
            return;
          }

          const simplifiedSource = simplifyWriting(source);
          let result = activeClarityMode === 'summarize'
            ? summarizeWriting(simplifiedSource)
            : activeClarityMode === 'bullets'
              ? getWritingSentences(simplifiedSource).join('\n')
              : simplifiedSource;
          result = applyClarityTone(result, clarityTone.value).trim();
          if (!result) {
            setClarityStatus('There was no text to rewrite. Try adding a sentence.', 'error');
            return;
          }

          currentClarityResult = result;
          renderClarityResult(result, activeClarityMode);
          clarityResultMeta.textContent = `${modeNames[activeClarityMode]} · ${toneNames[clarityTone.value]}`;
          clarityCopyButton.disabled = false;
          setClarityStatus('Done in your browser. Review the result to make sure it keeps your meaning.');
        }

        clarityModeButtons.forEach((button) => {
          button.addEventListener('click', () => {
            const mode = button.dataset.clarityMode;
            if (!mode || !Object.hasOwn(modeNames, mode)) return;
            activeClarityMode = mode;
            clarityModeButtons.forEach((modeButton) => {
              const isActive = modeButton === button;
              modeButton.classList.toggle('is-active', isActive);
              modeButton.setAttribute('aria-pressed', String(isActive));
            });
            if (clarityInput.value.trim()) runClarityRewrite();
            else setClarityStatus('Add text to preview this writing option.');
          });
        });

        clarityInput.addEventListener('input', () => {
          clarityCount.textContent = String(clarityInput.value.length);
          if (currentClarityResult) setClarityPlaceholder();
          if (clarityInput.value.length === Number(clarityInput.maxLength)) {
            setClarityStatus('You have reached the 5,000 character limit.', 'error');
          } else {
            setClarityStatus('Your text stays on this device. Choose how you would like to edit it.');
          }
        });

        clarityExampleButton.addEventListener('click', () => {
          clarityInput.value = exampleText;
          clarityInput.dispatchEvent(new Event('input', { bubbles: true }));
          clarityInput.focus();
        });

        clarityRunButton.addEventListener('click', runClarityRewrite);
        clarityClearButton.addEventListener('click', () => {
          clarityInput.value = '';
          clarityCount.textContent = '0';
          setClarityPlaceholder();
          setClarityStatus('Text cleared. Add a draft whenever you are ready.');
          clarityInput.focus();
        });

        clarityTone.addEventListener('change', () => {
          if (clarityInput.value.trim()) runClarityRewrite();
          else setClarityStatus('Add text to preview this tone.');
        });

        clarityCopyButton.addEventListener('click', async () => {
          if (!currentClarityResult) return;
          try {
            await navigator.clipboard.writeText(currentClarityResult);
            setClarityStatus('Copied. Your rewritten text is ready to paste.');
          } catch (error) {
            console.error('Unable to copy Clarity Lab result:', error);
            setClarityStatus('Could not access the clipboard. Select the result and copy it manually.', 'error');
          }
        });

        clarityCount.textContent = String(clarityInput.value.length);
      }
    }

    function reorganizeGarden() {
      cancelGardenLayout();
      const positions = nodes.map((node) => ({ id: node.id, x: node.x, y: node.y }));
      const linksById = links.map((link) => ({
        from: positions.find((node) => node.id === link.from),
        to: positions.find((node) => node.id === link.to),
        strength: link.strength
      })).filter((link) => link.from && link.to);
      const iterations = 100;

      for (let iteration = 0; iteration < iterations; iteration += 1) {
        const forces = positions.map(() => ({ x: 0, y: 0 }));
        for (let first = 0; first < positions.length; first += 1) {
          for (let second = first + 1; second < positions.length; second += 1) {
            const dx = positions[first].x - positions[second].x;
            const dy = positions[first].y - positions[second].y;
            const distance = Math.max(1, Math.hypot(dx, dy));
            const force = 3600 / (distance * distance);
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            forces[first].x += fx;
            forces[first].y += fy;
            forces[second].x -= fx;
            forces[second].y -= fy;
          }
        }

        linksById.forEach((link) => {
          const fromIndex = positions.indexOf(link.from);
          const toIndex = positions.indexOf(link.to);
          const dx = link.to.x - link.from.x;
          const dy = link.to.y - link.from.y;
          const distance = Math.max(1, Math.hypot(dx, dy));
          const force = ((distance - 145) * 0.0022 * link.strength) / distance;
          forces[fromIndex].x += dx * force;
          forces[fromIndex].y += dy * force;
          forces[toIndex].x -= dx * force;
          forces[toIndex].y -= dy * force;
        });

        const temperature = 1 - iteration / iterations;
        positions.forEach((position, index) => {
          forces[index].x += (400 - position.x) * 0.0007;
          forces[index].y += (300 - position.y) * 0.0007;
          const magnitude = Math.hypot(forces[index].x, forces[index].y);
          const step = Math.min(3.2, magnitude) * temperature;
          if (magnitude > 0) {
            position.x = Math.min(760, Math.max(40, position.x + (forces[index].x / magnitude) * step));
            position.y = Math.min(560, Math.max(40, position.y + (forces[index].y / magnitude) * step));
          }
        });
      }

      const startPositions = nodes.map((node) => ({ id: node.id, x: node.x, y: node.y }));
      const targetById = new Map(positions.map((position) => [position.id, position]));
      const targetPositions = nodes.map((node) => targetById.get(node.id));
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        nodes.forEach((node, index) => {
          node.x = targetPositions[index].x;
          node.y = targetPositions[index].y;
        });
        renderGarden();
      } else {
        const startTime = performance.now();
        const duration = 720;
        const animate = (time) => {
          const progress = Math.min(1, (time - startTime) / duration);
          const eased = 1 - ((1 - progress) ** 3);
          nodes.forEach((node, index) => {
            node.x = startPositions[index].x + ((targetPositions[index].x - startPositions[index].x) * eased);
            node.y = startPositions[index].y + ((targetPositions[index].y - startPositions[index].y) * eased);
          });
          renderGarden();
          if (progress < 1) layoutAnimationId = requestAnimationFrame(animate);
          else layoutAnimationId = null;
        };
        layoutAnimationId = requestAnimationFrame(animate);
      }
      selectedNodeId = null;
      renderGarden();
      setGardenStatus('Reorganizing the network around its connections.');
    }

    gardenNodesLayer.addEventListener('keydown', (event) => {
      if (!(event.target instanceof Element)) return;
      if (event.key === 'Escape' && linkMode) {
        event.preventDefault();
        linkMode = false;
        selectedNodeId = null;
        gardenConnectButton.setAttribute('aria-pressed', 'false');
        renderGarden();
        setGardenStatus('Connection mode off. Drag a node or explore a point.');
        return;
      }
      const nodeElement = event.target.closest('[data-node-id]');
      if (!(nodeElement instanceof SVGGElement)) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activateGardenNode(nodeElement.dataset.nodeId);
      }
    });

    gardenSvg.addEventListener('pointerdown', (event) => {
      if (!(event.target instanceof Element)) return;
      const nodeElement = event.target.closest('[data-node-id]');
      if (!(nodeElement instanceof SVGGElement)) return;
      if (linkMode) {
        dragState = { nodeId: nodeElement.dataset.nodeId, pointerId: event.pointerId, moved: false, linkOnly: true };
        gardenSvg.setPointerCapture(event.pointerId);
        event.preventDefault();
        return;
      }
      const point = gardenPointFromEvent(event);
      const node = nodes.find((item) => item.id === nodeElement.dataset.nodeId);
      if (!point || !node) return;
      cancelGardenLayout();
      dragState = {
        nodeId: node.id,
        pointerId: event.pointerId,
        startX: point.x,
        startY: point.y,
        nodeX: node.x,
        nodeY: node.y,
        moved: false
      };
      gardenSvg.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    gardenSvg.addEventListener('pointermove', (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId || dragState.linkOnly) return;
      const point = gardenPointFromEvent(event);
      const node = nodes.find((item) => item.id === dragState.nodeId);
      if (!point || !node) return;
      if (Math.hypot(point.x - dragState.startX, point.y - dragState.startY) > 3) dragState.moved = true;
      if (!dragState.moved) return;
      node.x = Math.min(765, Math.max(35, dragState.nodeX + point.x - dragState.startX));
      node.y = Math.min(565, Math.max(35, dragState.nodeY + point.y - dragState.startY));
      renderGarden();
    });

    gardenSvg.addEventListener('pointerup', (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      const completedDrag = dragState;
      dragState = null;
      if (gardenSvg.hasPointerCapture(event.pointerId)) gardenSvg.releasePointerCapture(event.pointerId);
      if (completedDrag.linkOnly || !completedDrag.moved) {
        activateGardenNode(completedDrag.nodeId);
      } else {
        selectedNodeId = completedDrag.nodeId;
        renderGarden();
        setGardenStatus('Node moved. Its connections follow it through the garden.');
      }
    });

    gardenSvg.addEventListener('pointercancel', () => {
      dragState = null;
      renderGarden();
    });

    gardenForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const labelInput = gardenForm.querySelector('[name="label"]');
      const kindInput = gardenForm.querySelector('[name="kind"]');
      if (!(labelInput instanceof HTMLInputElement) || !(kindInput instanceof HTMLSelectElement)) return;
      const label = labelInput.value.trim();
      if (!label) {
        labelInput.setCustomValidity('Give your node a name first.');
        labelInput.reportValidity();
        return;
      }
      labelInput.setCustomValidity('');
      if (nodes.length >= 40) {
        setGardenStatus('This garden is full. Reset it before adding more nodes.');
        return;
      }
      if (nodes.some((node) => node.label.toLowerCase() === label.toLowerCase())) {
        setGardenStatus('That idea is already in the garden. Try a different name.');
        labelInput.focus();
        return;
      }

      cancelGardenLayout();
      const angle = nextNodeId * 2.399;
      const distance = 90 + (Math.floor(nodes.length / 5) * 18);
      const id = `visitor-${nextNodeId}`;
      nextNodeId += 1;
      nodes.push({
        id,
        label,
        kind: kindInput.value,
        x: Math.min(750, Math.max(50, 400 + Math.cos(angle) * distance)),
        y: Math.min(545, Math.max(55, 300 + Math.sin(angle) * distance)),
        radius: 14
      });
      gardenNodeFilter.value = 'all';
      selectedNodeId = id;
      renderGarden();
      labelInput.value = '';
      setGardenStatus(`${label} added. Choose Connect nodes to link it to another idea.`);
      labelInput.focus();
    });

    const gardenLabelInput = gardenForm.querySelector('[name="label"]');
    if (gardenLabelInput instanceof HTMLInputElement) {
      gardenLabelInput.addEventListener('input', () => gardenLabelInput.setCustomValidity(''));
    }

    gardenNodeFilter.addEventListener('change', () => {
      selectedNodeId = null;
      renderGarden();
      setGardenStatus('Showing the selected signal type.');
    });
    gardenLinkFilter.addEventListener('change', () => {
      renderGarden();
      setGardenStatus('Connection filter updated.');
    });
    gardenShowLinks.addEventListener('change', () => {
      renderGarden();
      setGardenStatus(gardenShowLinks.checked ? 'Connections are visible.' : 'Connections are hidden.');
    });
    gardenConnectButton.addEventListener('click', () => {
      linkMode = !linkMode;
      selectedNodeId = null;
      gardenConnectButton.setAttribute('aria-pressed', String(linkMode));
      renderGarden();
      setGardenStatus(linkMode
        ? 'Choose a first node, then choose a second node to connect them.'
        : 'Connection mode off. Drag a node or explore a point.');
    });
    gardenReorganizeButton.addEventListener('click', reorganizeGarden);
    gardenResetButton.addEventListener('click', () => {
      cancelGardenLayout();
      nodes = cloneNodes();
      links = initialLinks.map((link) => ({ ...link }));
      selectedNodeId = null;
      linkMode = false;
      nextNodeId = 1;
      gardenForm.reset();
      gardenNodeFilter.value = 'all';
      gardenLinkFilter.value = 'all';
      gardenShowLinks.checked = true;
      gardenConnectButton.setAttribute('aria-pressed', 'false');
      renderGarden();
      setGardenStatus('Garden reset. Drag a node or make a new connection.');
    });

    renderGarden();
  }
}

const atmosphereStudio = document.querySelector('[data-atmosphere-studio]');
if (atmosphereStudio instanceof HTMLElement) {
  const artCanvas = atmosphereStudio.querySelector('[data-art-canvas]');
  const artContext = artCanvas instanceof HTMLCanvasElement ? artCanvas.getContext('2d') : null;
  const artStatus = atmosphereStudio.querySelector('[data-art-status]');
  const artSeedLabel = atmosphereStudio.querySelector('[data-art-seed]');
  const modeButtons = [...atmosphereStudio.querySelectorAll('[data-art-mode]')];
  const modeDescription = atmosphereStudio.querySelector('[data-art-mode-description]');
  const densityInput = atmosphereStudio.querySelector('[data-art-control="density"]');
  const motionInput = atmosphereStudio.querySelector('[data-art-control="motion"]');
  const complexityInput = atmosphereStudio.querySelector('[data-art-control="complexity"]');
  const trailsInput = atmosphereStudio.querySelector('[data-art-control="trails"]');
  const interactionInput = atmosphereStudio.querySelector('[data-art-interaction]');
  const pauseButton = atmosphereStudio.querySelector('[data-art-action="pause"]');
  const randomizeButton = atmosphereStudio.querySelector('[data-art-action="randomize"]');
  const clearButton = atmosphereStudio.querySelector('[data-art-action="clear"]');
  const snapshotButton = atmosphereStudio.querySelector('[data-art-action="snapshot"]');
  const resetButton = atmosphereStudio.querySelector('[data-art-action="reset"]');

  if (artCanvas instanceof HTMLCanvasElement && artContext && artStatus instanceof HTMLElement
    && artSeedLabel instanceof HTMLElement && modeDescription instanceof HTMLElement
    && densityInput instanceof HTMLInputElement && motionInput instanceof HTMLInputElement
    && complexityInput instanceof HTMLInputElement && trailsInput instanceof HTMLInputElement
    && interactionInput instanceof HTMLSelectElement && pauseButton instanceof HTMLButtonElement
    && randomizeButton instanceof HTMLButtonElement && clearButton instanceof HTMLButtonElement
    && snapshotButton instanceof HTMLButtonElement && resetButton instanceof HTMLButtonElement
    && modeButtons.every((button) => button instanceof HTMLButtonElement)) {
    const startingValues = { density: '240', motion: '45', complexity: '55', trails: '70' };
    const modeDescriptions = {
      flow: 'Silk-like paths drift through an invisible field.',
      particles: 'A constellation of points wanders, gathers, and scatters.',
      orbit: 'Quiet planetary forms circle unseen centers.'
    };
    const palette = ['#174b35', '#698b70', '#a4b99b', '#c19a5b'];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let mode = 'flow';
    let seed = 1923;
    let random = createRandom(seed);
    let agents = [];
    let canvasWidth = 0;
    let canvasHeight = 0;
    let frameId = 0;
    let previousFrameTime = 0;
    let paused = reducedMotion;
    let pointer = { x: 0, y: 0, active: false };

    function createRandom(initialSeed) {
      let state = initialSeed >>> 0;
      if (state === 0) state = 1;
      return () => {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        return (state >>> 0) / 4294967296;
      };
    }

    function setArtStatus(message, state = 'info') {
      artStatus.textContent = message;
      artStatus.dataset.state = state;
    }

    function currentDensity() {
      return Number(densityInput.value);
    }

    function buildAgents() {
      random = createRandom(seed);
      agents = Array.from({ length: currentDensity() }, () => {
        const x = random() * canvasWidth;
        const y = random() * canvasHeight;
        return {
          x,
          y,
          previousX: x,
          previousY: y,
          velocityX: (random() - 0.5) * 0.5,
          velocityY: (random() - 0.5) * 0.5,
          anchorX: random() * canvasWidth,
          anchorY: random() * canvasHeight,
          radius: 8 + random() * Math.min(canvasWidth, canvasHeight) * 0.19,
          angle: random() * Math.PI * 2,
          orbitSpeed: 0.003 + random() * 0.012,
          size: 0.6 + random() * 1.2,
          color: palette[Math.floor(random() * palette.length)]
        };
      });
    }

    function resizeCanvas() {
      const bounds = artCanvas.getBoundingClientRect();
      const width = Math.floor(bounds.width);
      const height = Math.floor(bounds.height);
      if (width < 1 || height < 1 || (width === canvasWidth && height === canvasHeight)) return;

      canvasWidth = width;
      canvasHeight = height;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      artCanvas.width = Math.round(width * pixelRatio);
      artCanvas.height = Math.round(height * pixelRatio);
      artContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      buildAgents();
      artContext.fillStyle = '#f5f5f0';
      artContext.fillRect(0, 0, canvasWidth, canvasHeight);
      if (paused) renderFrame(1);
    }

    function getPointerForce(x, y) {
      if (!pointer.active || interactionInput.value === 'none') return { x: 0, y: 0 };
      const deltaX = pointer.x - x;
      const deltaY = pointer.y - y;
      const distance = Math.hypot(deltaX, deltaY);
      const radius = Math.min(canvasWidth, canvasHeight) * 0.24;
      if (distance === 0 || distance > radius) return { x: 0, y: 0 };
      const direction = interactionInput.value === 'repel' ? -1 : 1;
      const strength = (1 - distance / radius) * (Number(motionInput.value) / 100) * 1.8 * direction;
      return { x: (deltaX / distance) * strength, y: (deltaY / distance) * strength };
    }

    function moveAgent(agent, distance, time) {
      const complexity = Number(complexityInput.value) / 100;
      const frequency = 1.2 + complexity * 4.2;
      const waveX = (agent.x / canvasWidth) * frequency + time * 0.000035;
      const waveY = (agent.y / canvasHeight) * frequency * 0.82 - time * 0.000027;
      const angle = Math.sin(waveX * Math.PI * 2) * 1.65
        + Math.cos(waveY * Math.PI * 2) * 1.55
        + Math.sin((waveX + waveY) * Math.PI) * 0.9;
      const speed = 0.2 + (Number(motionInput.value) / 100) * 1.65;
      const force = getPointerForce(agent.x, agent.y);
      agent.x += (Math.cos(angle) * speed + force.x) * distance;
      agent.y += (Math.sin(angle) * speed + force.y) * distance;
      return angle;
    }

    function resetAgentPosition(agent) {
      const edge = Math.floor(random() * 4);
      if (edge === 0) {
        agent.x = random() * canvasWidth;
        agent.y = 0;
      } else if (edge === 1) {
        agent.x = canvasWidth;
        agent.y = random() * canvasHeight;
      } else if (edge === 2) {
        agent.x = random() * canvasWidth;
        agent.y = canvasHeight;
      } else {
        agent.x = 0;
        agent.y = random() * canvasHeight;
      }
      agent.previousX = agent.x;
      agent.previousY = agent.y;
    }

    function renderFrame(distance, time = performance.now()) {
      const trail = Number(trailsInput.value) / 100;
      const fade = 0.25 - trail * 0.205;
      artContext.fillStyle = `rgba(245, 245, 240, ${fade})`;
      artContext.fillRect(0, 0, canvasWidth, canvasHeight);
      const motionScale = Number(motionInput.value) / 45;
      const complexity = Number(complexityInput.value) / 100;

      if (mode === 'flow') {
        agents.forEach((agent) => {
          agent.previousX = agent.x;
          agent.previousY = agent.y;
          moveAgent(agent, distance, time);
          if (agent.x < -2 || agent.x > canvasWidth + 2 || agent.y < -2 || agent.y > canvasHeight + 2) {
            resetAgentPosition(agent);
          }
          artContext.beginPath();
          artContext.moveTo(agent.previousX, agent.previousY);
          artContext.lineTo(agent.x, agent.y);
          artContext.strokeStyle = agent.color;
          artContext.globalAlpha = 0.24 + complexity * 0.28;
          artContext.lineWidth = agent.size * (0.55 + complexity * 0.35);
          artContext.stroke();
        });
      } else if (mode === 'particles') {
        agents.forEach((agent) => {
          const angle = moveAgent(agent, distance, time);
          agent.velocityX = agent.velocityX * 0.92 + Math.cos(angle) * 0.055 * motionScale;
          agent.velocityY = agent.velocityY * 0.92 + Math.sin(angle) * 0.055 * motionScale;
          agent.x += agent.velocityX * distance;
          agent.y += agent.velocityY * distance;
          if (agent.x < 0 || agent.x > canvasWidth || agent.y < 0 || agent.y > canvasHeight) {
            agent.x = random() * canvasWidth;
            agent.y = random() * canvasHeight;
            agent.velocityX = 0;
            agent.velocityY = 0;
          }
          artContext.beginPath();
          artContext.arc(agent.x, agent.y, agent.size * (0.8 + complexity), 0, Math.PI * 2);
          artContext.fillStyle = agent.color;
          artContext.globalAlpha = 0.38 + complexity * 0.42;
          artContext.fill();
        });
      } else {
        const orbitAgents = agents.slice(0, Math.max(24, Math.round(agents.length * 0.62)));
        orbitAgents.forEach((agent) => {
          agent.angle += agent.orbitSpeed * motionScale * distance;
          const x = agent.anchorX + Math.cos(agent.angle) * agent.radius;
          const y = agent.anchorY + Math.sin(agent.angle) * agent.radius * 0.58;
          const force = getPointerForce(x, y);
          const influencedX = x + force.x * 5;
          const influencedY = y + force.y * 5;
          if (agent.anchorX < -agent.radius || agent.anchorX > canvasWidth + agent.radius
            || agent.anchorY < -agent.radius || agent.anchorY > canvasHeight + agent.radius) {
            agent.anchorX = random() * canvasWidth;
            agent.anchorY = random() * canvasHeight;
          }
          artContext.beginPath();
          artContext.moveTo(agent.anchorX, agent.anchorY);
          artContext.lineTo(influencedX, influencedY);
          artContext.strokeStyle = agent.color;
          artContext.globalAlpha = 0.13 + complexity * 0.13;
          artContext.lineWidth = 0.6 + complexity * 0.5;
          artContext.stroke();
          artContext.beginPath();
          artContext.arc(influencedX, influencedY, agent.size * (1.2 + complexity), 0, Math.PI * 2);
          artContext.fillStyle = agent.color;
          artContext.globalAlpha = 0.48 + complexity * 0.35;
          artContext.fill();
        });
      }
      artContext.globalAlpha = 1;
    }

    function animate(time) {
      if (paused) return;
      const distance = previousFrameTime ? Math.min((time - previousFrameTime) / 16.67, 2) : 1;
      previousFrameTime = time;
      renderFrame(distance, time);
      frameId = window.requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (paused) return;
      window.cancelAnimationFrame(frameId);
      previousFrameTime = 0;
      frameId = window.requestAnimationFrame(animate);
    }

    function updateSeedLabel() {
      artSeedLabel.textContent = `SEED ${String(seed).padStart(5, '0')}`;
    }

    function setMode(nextMode) {
      mode = nextMode;
      modeButtons.forEach((button) => {
        const isActive = button.dataset.artMode === mode;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });
      modeDescription.textContent = modeDescriptions[mode];
      setArtStatus(`${mode[0].toUpperCase()}${mode.slice(1)} mode · move across the canvas to shape the motion.`);
      artContext.fillStyle = '#f5f5f0';
      artContext.fillRect(0, 0, canvasWidth, canvasHeight);
      if (paused) renderFrame(1);
    }

    function clearCanvas() {
      buildAgents();
      artContext.fillStyle = '#f5f5f0';
      artContext.fillRect(0, 0, canvasWidth, canvasHeight);
      if (paused) setArtStatus('Canvas cleared. Resume to begin a fresh trace.');
      else setArtStatus('Canvas cleared. A fresh trace is beginning.');
    }

    function randomize() {
      seed = Math.floor(Math.random() * 90000) + 10000;
      updateSeedLabel();
      clearCanvas();
      setArtStatus(`New composition · seed ${seed}. Shape it with your pointer.`);
    }

    function resetStudio() {
      densityInput.value = startingValues.density;
      motionInput.value = startingValues.motion;
      complexityInput.value = startingValues.complexity;
      trailsInput.value = startingValues.trails;
      interactionInput.value = 'attract';
      document.querySelectorAll('[data-art-value]').forEach((output) => {
        if (!(output instanceof HTMLOutputElement)) return;
        const key = output.dataset.artValue;
        if (key && startingValues[key]) output.value = startingValues[key];
      });
      seed = 1923;
      updateSeedLabel();
      setMode('flow');
      clearCanvas();
      setArtStatus('Back to the original flow field.');
    }

    function saveSnapshot() {
      snapshotButton.disabled = true;
      artCanvas.toBlob((blob) => {
        snapshotButton.disabled = false;
        if (!blob) {
          setArtStatus('PNG export failed. Try again after the canvas has drawn.', 'error');
          return;
        }
        const downloadUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = `atmosphere-${seed}.png`;
        downloadLink.click();
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        setArtStatus(`PNG saved · atmosphere-${seed}.png`);
      }, 'image/png');
    }

    function updateRangeValue(input) {
      const output = atmosphereStudio.querySelector(`[data-art-value="${input.dataset.artControl}"]`);
      if (output instanceof HTMLOutputElement) output.value = input.value;
    }

    modeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (button.dataset.artMode) setMode(button.dataset.artMode);
      });
    });

    [densityInput, motionInput, complexityInput, trailsInput].forEach((input) => {
      input.addEventListener('input', () => {
        updateRangeValue(input);
        if (input === densityInput) {
          buildAgents();
          setArtStatus(`Density updated · ${currentDensity()} elements in the field.`);
        }
      });
    });

    pauseButton.addEventListener('click', () => {
      paused = !paused;
      pauseButton.textContent = paused ? 'Resume' : 'Pause';
      pauseButton.setAttribute('aria-pressed', String(paused));
      if (paused) {
        window.cancelAnimationFrame(frameId);
        setArtStatus('Animation paused. Your canvas is ready to save.');
      } else {
        setArtStatus('The artwork is moving again.');
        startAnimation();
      }
    });
    randomizeButton.addEventListener('click', randomize);
    clearButton.addEventListener('click', clearCanvas);
    snapshotButton.addEventListener('click', saveSnapshot);
    resetButton.addEventListener('click', resetStudio);

    artCanvas.addEventListener('pointermove', (event) => {
      const bounds = artCanvas.getBoundingClientRect();
      pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top, active: true };
    });
    artCanvas.addEventListener('pointerleave', () => {
      pointer.active = false;
    });
    artCanvas.addEventListener('pointerdown', (event) => {
      const bounds = artCanvas.getBoundingClientRect();
      pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top, active: true };
    });

    updateSeedLabel();
    resizeCanvas();
    renderFrame(1);
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
    pauseButton.setAttribute('aria-pressed', String(paused));
    if (paused) setArtStatus('Reduced motion is enabled. Resume when you’re ready.');
    else startAnimation();

    if ('ResizeObserver' in window) {
      new ResizeObserver(resizeCanvas).observe(artCanvas);
    } else {
      window.addEventListener('resize', resizeCanvas);
    }
  }

  const typeStudio = document.querySelector('[data-type-studio]');
  if (typeStudio instanceof HTMLElement) {
    const typeText = typeStudio.querySelector('[data-type-text]');
    const typePreview = typeStudio.querySelector('[data-type-preview]');
    const typePreviewLines = typeStudio.querySelector('[data-type-preview-lines]');
    const typePreviewScreenReader = typeStudio.querySelector('[data-type-preview-sr]');
    const typeCount = typeStudio.querySelector('[data-type-count]');
    const typePrinciple = typeStudio.querySelector('[data-type-principle]');
    const typeModeLabel = typeStudio.querySelector('[data-type-mode-label]');
    const typeModeNote = typeStudio.querySelector('[data-type-mode-note]');
    const typeStatus = typeStudio.querySelector('[data-type-status]');
    const typePhrase = typeStudio.querySelector('[data-type-phrase]');
    const typePauseButton = typeStudio.querySelector('[data-type-action="play"]');
    const typeReducedMotion = typeStudio.querySelector('[data-type-reduced-motion]');
    const typeEmphasis = typeStudio.querySelector('[data-type-emphasis]');
    const typeTabs = [...typeStudio.querySelectorAll('[data-type-tab]')];
    const typePanels = [...typeStudio.querySelectorAll('[data-type-panel]')];
    const typeModeButtons = [...typeStudio.querySelectorAll('[data-type-mode]')];
    const typeSettings = [...typeStudio.querySelectorAll('[data-type-setting]')];
    const typeExportStatus = document.querySelector('[data-type-export-status]');
    const typePosterFormat = document.querySelector('[data-type-poster-format]');
    const typeChallengeStatus = document.querySelector('[data-type-challenge-status]');
    const typeMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (typeText instanceof HTMLTextAreaElement && typePreview instanceof HTMLElement
      && typePreviewLines instanceof HTMLElement && typePreviewScreenReader instanceof HTMLElement
      && typeCount instanceof HTMLOutputElement && typePrinciple instanceof HTMLElement
      && typeModeLabel instanceof HTMLElement && typeStatus instanceof HTMLElement
      && typePhrase instanceof HTMLSelectElement && typePauseButton instanceof HTMLButtonElement
      && typeReducedMotion instanceof HTMLInputElement && typeExportStatus instanceof HTMLElement
      && typePosterFormat instanceof HTMLSelectElement) {
      const defaults = {
        text: 'Make it move.',
        font: 'display',
        weight: '800',
        size: '72',
        leading: '92',
        tracking: '-2',
        'word-spacing': '0',
        speed: '5',
        intensity: '50',
        stagger: '80',
        easing: 'ease-in-out',
        direction: '1',
        ink: '#14251c',
        paper: '#d5ef8c',
        width: '88',
        padding: '48',
        mode: 'flow',
        align: 'center',
        emphasis: false
      };
      const phrases = ['Make it move.', 'Find your rhythm', 'Stay curious', 'Take up space'];
      const fontFamilies = {
        display: "'Manrope', Arial, sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
        sans: "Arial, Helvetica, sans-serif",
        mono: "'Courier New', monospace"
      };
      const motionNotes = {
        flow: 'Letters travel together: continuity creates a calm, readable rhythm.',
        bounce: 'Each character rises in sequence: stagger creates timing, anticipation, and pulse.',
        scatter: 'Characters loosen their spatial relationships, then return to the phrase as a group.',
        wave: 'A repeating offset passes from letter to letter: rhythm comes from pattern and phase.'
      };
      const modeNames = { flow: 'FLOW', bounce: 'BOUNCE', scatter: 'SCATTER', wave: 'WAVE' };
      const lessons = {
        flow: 'Flow uses continuity and direction to make a phrase feel smooth.',
        bounce: 'Bounce uses stagger and easing to make a phrase feel rhythmic.',
        scatter: 'Scatter breaks grouping, drawing attention to individual characters.',
        wave: 'Wave repeats a pattern across letters to create a sense of rhythm.'
      };
      const settingInputs = Object.fromEntries(typeSettings.map((input) => [input.dataset.typeSetting, input]));
      let activeMode = 'flow';
      let activeAlignment = 'center';
      let isPaused = typeMotionQuery.matches;

      function setTypeStatus(message) {
        typeStatus.textContent = message;
      }

      function getSetting(name) {
        return settingInputs[name] instanceof HTMLInputElement || settingInputs[name] instanceof HTMLSelectElement
          ? settingInputs[name].value
          : defaults[name];
      }

      function getComposition() {
        return {
          text: typeText.value.slice(0, 48),
          font: getSetting('font'),
          weight: getSetting('weight'),
          size: getSetting('size'),
          leading: getSetting('leading'),
          tracking: getSetting('tracking'),
          'word-spacing': getSetting('word-spacing'),
          speed: getSetting('speed'),
          intensity: getSetting('intensity'),
          stagger: getSetting('stagger'),
          easing: getSetting('easing'),
          direction: getSetting('direction'),
          ink: getSetting('ink'),
          paper: getSetting('paper'),
          width: getSetting('width'),
          padding: getSetting('padding'),
          mode: activeMode,
          align: activeAlignment,
          emphasis: typeEmphasis instanceof HTMLInputElement && typeEmphasis.checked
        };
      }

      function setMode(nextMode) {
        if (!Object.hasOwn(modeNames, nextMode)) return;
        activeMode = nextMode;
        typePreview.dataset.mode = activeMode;
        typeModeLabel.textContent = `0${Object.keys(modeNames).indexOf(activeMode) + 1} / ${modeNames[activeMode]}`;
        typeModeButtons.forEach((button) => {
          const selected = button.dataset.typeMode === activeMode;
          button.setAttribute('aria-pressed', String(selected));
        });
        typePrinciple.textContent = lessons[activeMode];
        if (typeModeNote instanceof HTMLElement) typeModeNote.textContent = motionNotes[activeMode];
      }

      function renderTypeText() {
        const text = typeText.value.slice(0, 48);
        typeCount.value = String(text.length);
        typePreviewScreenReader.textContent = text || 'Your words will appear here.';
        typePreview.setAttribute('aria-label', text ? `Animated typography: ${text}` : 'Animated typography preview. No text entered.');
        typePreviewLines.replaceChildren();
        let characterIndex = 0;
        text.split('\n').forEach((lineText) => {
          const line = document.createElement('span');
          line.className = 'type-preview-line';
          lineText.split(/(\s+)/).filter(Boolean).forEach((segment) => {
            if (/^\s+$/.test(segment)) {
              line.append(document.createTextNode(segment));
              return;
            }
            [...segment].forEach((character) => {
              const letter = document.createElement('span');
              letter.className = 'type-letter';
              letter.textContent = character;
              letter.style.setProperty('--type-index', String(characterIndex));
              letter.style.setProperty('--type-x', String(((characterIndex * 17) % 31) - 15));
              letter.style.setProperty('--type-y', String(((characterIndex * 23) % 25) - 12));
              letter.style.setProperty('--type-rotate', String(((characterIndex * 13) % 27) - 13));
              line.append(letter);
              characterIndex += 1;
            });
          });
          if (lineText.length === 0) line.append(document.createTextNode('\u00a0'));
          typePreviewLines.append(line);
        });
      }

      function updateTypeValue(name, input) {
        const output = typeStudio.querySelector(`[data-type-value="${name}"]`);
        if (!(output instanceof HTMLOutputElement)) return;
        const values = {
          weight: input.value,
          size: `${input.value}px`,
          leading: (Number(input.value) / 100).toFixed(2),
          tracking: `${Number(input.value) > 0 ? '+' : ''}${input.value}px`,
          'word-spacing': `${Number(input.value) > 0 ? '+' : ''}${input.value}px`,
          speed: `${Number(input.value).toFixed(1)}s`,
          intensity: input.value,
          stagger: `${input.value}ms`,
          width: `${input.value}%`,
          padding: `${input.value}px`
        };
        output.value = values[name] || input.value;
      }

      function applyTypeSettings() {
        const composition = getComposition();
        typePreview.style.fontFamily = fontFamilies[composition.font];
        typePreview.style.fontWeight = composition.weight;
        typePreview.style.fontSize = `clamp(28px, 6vw, ${composition.size}px)`;
        typePreview.style.lineHeight = String(Number(composition.leading) / 100);
        typePreview.style.letterSpacing = `${composition.tracking}px`;
        typePreview.style.wordSpacing = `${composition['word-spacing']}px`;
        typePreview.style.textAlign = composition.align;
        typePreview.dataset.emphasis = String(composition.emphasis);
        typePreview.style.width = `${composition.width}%`;
        typePreview.style.setProperty('--type-duration', `${composition.speed}s`);
        typePreview.style.setProperty('--type-easing', composition.easing);
        typePreview.style.setProperty('--type-stagger', `${composition.stagger}ms`);
        typePreview.style.setProperty('--type-direction', composition.direction);
        typePreview.style.setProperty('--type-intensity', composition.intensity);
        typePreview.style.animationPlayState = isPaused ? 'paused' : 'running';
        typeStudio.querySelectorAll('.type-letter').forEach((letter) => {
          if (letter instanceof HTMLElement) {
            letter.style.animationPlayState = isPaused ? 'paused' : 'running';
            letter.style.setProperty('animation-duration', `${composition.speed}s`, 'important');
            letter.style.setProperty('animation-iteration-count', 'infinite', 'important');
          }
        });
        const wrap = typeStudio.querySelector('[data-type-preview-wrap]');
        if (wrap instanceof HTMLElement) {
          wrap.style.backgroundColor = composition.paper;
          wrap.style.color = composition.ink;
          wrap.style.padding = `${Math.max(14, Number(composition.padding) * 0.65)}px`;
        }
        typePreview.style.color = composition.ink;
        typePreview.dataset.mode = activeMode;
        setMode(activeMode);
      }

      function setSetting(name, value) {
        const input = settingInputs[name];
        if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement)) return;
        input.value = String(value);
        if (input instanceof HTMLInputElement && input.type === 'range') updateTypeValue(name, input);
      }

      function setAlignment(alignment) {
        activeAlignment = alignment;
        typeStudio.querySelectorAll('[data-type-align]').forEach((button) => {
          button.setAttribute('aria-pressed', String(button.dataset.typeAlign === alignment));
        });
      }

      function setPaused(paused, announce = true) {
        isPaused = paused;
        typePauseButton.textContent = isPaused ? '▶ Play motion' : 'Ⅱ Pause motion';
        typePauseButton.setAttribute('aria-pressed', String(isPaused));
        typeStudio.classList.toggle('type-is-paused', isPaused);
        typePreview.classList.toggle('is-paused', isPaused);
        applyTypeSettings();
        if (announce) setTypeStatus(isPaused ? 'Motion stopped. The current composition remains visible.' : 'Motion resumed.');
      }

      function resetTypeStudio() {
        typeText.value = defaults.text;
        typePhrase.value = '';
        Object.entries(defaults).forEach(([name, value]) => {
          if (name !== 'text' && name !== 'mode' && name !== 'align') setSetting(name, value);
        });
        setAlignment(defaults.align);
        setMode(defaults.mode);
        typeReducedMotion.checked = typeMotionQuery.matches;
        if (typeEmphasis instanceof HTMLInputElement) typeEmphasis.checked = defaults.emphasis;
        setPaused(typeReducedMotion.checked, false);
        renderTypeText();
        applyTypeSettings();
        setTypeStatus('Back to the original composition.');
      }

      function randomizeType() {
        typeText.value = phrases[Math.floor(Math.random() * phrases.length)];
        typePhrase.value = phrases.includes(typeText.value) ? typeText.value : '';
        const modeNamesList = Object.keys(modeNames);
        setMode(modeNamesList[Math.floor(Math.random() * modeNamesList.length)]);
        setSetting('weight', [500, 700, 800, 900][Math.floor(Math.random() * 4)]);
        setSetting('tracking', [-4, -2, 1, 5][Math.floor(Math.random() * 4)]);
        setSetting('intensity', 25 + Math.floor(Math.random() * 70));
        setSetting('speed', [3, 4, 6, 8][Math.floor(Math.random() * 4)]);
        setAlignment(['left', 'center', 'right'][Math.floor(Math.random() * 3)]);
        renderTypeText();
        applyTypeSettings();
        setTypeStatus('A new starting point. Change one choice at a time and notice the mood shift.');
      }

      function activateTab(tabName, focusTab = false) {
        typeTabs.forEach((tab) => {
          const selected = tab.dataset.typeTab === tabName;
          tab.setAttribute('aria-selected', String(selected));
          tab.tabIndex = selected ? 0 : -1;
          if (selected && focusTab) tab.focus();
        });
        typePanels.forEach((panel) => {
          panel.hidden = panel.dataset.typePanel !== tabName;
        });
      }

      function loadComposition(composition, announce = true) {
        const allowedModes = Object.keys(modeNames);
        if (typeof composition.text === 'string') typeText.value = composition.text.slice(0, 48);
        Object.keys(defaults).forEach((name) => {
          if (['text', 'mode', 'align'].includes(name) || composition[name] === undefined) return;
          const input = settingInputs[name];
          if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement)) return;
          if (input instanceof HTMLInputElement && input.type === 'color'
            && !/^#[\da-f]{6}$/i.test(String(composition[name]))) return;
          if (input instanceof HTMLSelectElement && ![...input.options].some((option) => option.value === composition[name])) return;
          if (input instanceof HTMLInputElement && input.type === 'range') {
            const value = Number(composition[name]);
            if (!Number.isFinite(value)) return;
            const min = Number(input.min);
            const max = Number(input.max);
            setSetting(name, Math.min(max, Math.max(min, value)));
          } else {
            setSetting(name, composition[name]);
          }
        });
        if (allowedModes.includes(composition.mode)) setMode(composition.mode);
        if (['left', 'center', 'right'].includes(composition.align)) setAlignment(composition.align);
        if (typeEmphasis instanceof HTMLInputElement) typeEmphasis.checked = composition.emphasis === true;
        typePhrase.value = phrases.includes(typeText.value) ? typeText.value : '';
        renderTypeText();
        applyTypeSettings();
        if (announce) setTypeStatus('Composition loaded. Adjust any setting to make it your own.');
      }

      function restoreSharedComposition() {
        const encoded = new URLSearchParams(window.location.search).get('type');
        if (!encoded || encoded.length > 1500) return;
        try {
          const composition = JSON.parse(encoded);
          if (composition && typeof composition === 'object' && !Array.isArray(composition)) {
            loadComposition(composition, false);
            setTypeStatus('Shared composition loaded. Make it your own.');
          }
        } catch (error) {
          console.warn('Unable to read shared typography settings:', error);
          setTypeStatus('The shared settings could not be read; the default composition is ready.');
        }
      }

      typeTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => activateTab(tab.dataset.typeTab));
        tab.addEventListener('keydown', (event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          const direction = event.key === 'ArrowRight' ? 1 : -1;
          const nextTab = typeTabs[(index + direction + typeTabs.length) % typeTabs.length];
          if (nextTab.dataset.typeTab) activateTab(nextTab.dataset.typeTab, true);
        });
      });

      typeText.addEventListener('input', () => {
        renderTypeText();
        setTypeStatus('Text updated. Watch how the same motion changes with a new phrase.');
      });
      typePhrase.addEventListener('change', () => {
        if (typePhrase.value) {
          typeText.value = typePhrase.value;
          renderTypeText();
          setTypeStatus('Phrase loaded. Try changing one typographic choice.');
        }
      });
      typeModeButtons.forEach((button) => {
        button.addEventListener('click', () => {
          if (!button.dataset.typeMode) return;
          setMode(button.dataset.typeMode);
          applyTypeSettings();
        });
      });
      typeSettings.forEach((input) => {
        input.addEventListener('input', () => {
          const name = input.dataset.typeSetting;
          if (!name) return;
          if (input instanceof HTMLInputElement && input.type === 'range') updateTypeValue(name, input);
          applyTypeSettings();
        });
        input.addEventListener('change', applyTypeSettings);
      });
      if (typeEmphasis instanceof HTMLInputElement) typeEmphasis.addEventListener('change', applyTypeSettings);
      typeStudio.querySelectorAll('[data-type-align]').forEach((button) => {
        button.addEventListener('click', () => {
          if (button.dataset.typeAlign) {
            setAlignment(button.dataset.typeAlign);
            applyTypeSettings();
          }
        });
      });
      typeStudio.querySelector('[data-type-action="reset"]')?.addEventListener('click', resetTypeStudio);
      typeStudio.querySelector('[data-type-action="randomize"]')?.addEventListener('click', randomizeType);
      typePauseButton.addEventListener('click', () => {
        const nextPaused = !isPaused;
        typeReducedMotion.checked = nextPaused;
        setPaused(nextPaused);
      });
      typeReducedMotion.addEventListener('change', () => setPaused(typeReducedMotion.checked));
      typeMotionQuery.addEventListener('change', (event) => {
        if (!event.matches) return;
        typeReducedMotion.checked = true;
        setPaused(true);
        setTypeStatus('Your device prefers reduced motion, so animation has stopped.');
      });

      [typeText, ...typeSettings].forEach((input) => {
        input.addEventListener('input', () => {
          const composition = getComposition();
          typeStudio.style.setProperty('--type-ink', composition.ink);
        });
      });
      restoreSharedComposition();
      renderTypeText();
      [...typeSettings].forEach((input) => {
        if (input instanceof HTMLInputElement && input.type === 'range' && input.dataset.typeSetting) {
          updateTypeValue(input.dataset.typeSetting, input);
        }
      });
      typeReducedMotion.checked = typeMotionQuery.matches;
      setMode(activeMode);
      setPaused(typeReducedMotion.checked, false);

      document.querySelectorAll('[data-type-challenge]').forEach((button) => {
        button.addEventListener('click', () => {
          const challenge = button.dataset.typeChallenge;
          const presets = {
            energetic: { text: 'MOVE', mode: 'bounce', intensity: 78, stagger: 90, speed: 4, tracking: -3, align: 'center' },
            calm: { text: 'TAKE A BREATH', mode: 'flow', intensity: 22, stagger: 140, speed: 9, tracking: 5, align: 'center' },
            hero: { text: 'BEGIN\nwith one small step', mode: 'wave', intensity: 34, stagger: 100, speed: 7, weight: 800, align: 'left', emphasis: true }
          };
          const preset = presets[challenge];
          if (!preset || !(typeChallengeStatus instanceof HTMLElement)) return;
          loadComposition({ ...getComposition(), ...preset });
          activateTab('motion');
          typeChallengeStatus.textContent = `Brief loaded: ${challenge === 'hero' ? 'make BEGIN the hero' : `make it feel ${challenge}`}. Explore the settings; there is no single right answer.`;
          document.querySelector('#type-playground')?.scrollIntoView({ behavior: typeMotionQuery.matches ? 'auto' : 'smooth' });
        });
      });
    }
  }

  document.querySelectorAll('[data-lesson-control="tracking"]').forEach((input) => {
    if (!(input instanceof HTMLInputElement)) return;
    const sample = document.querySelector('[data-lesson-tracking]');
    const output = document.querySelector('[data-lesson-value="tracking"]');
    input.addEventListener('input', () => {
      if (sample instanceof HTMLElement) sample.style.letterSpacing = `${input.value}px`;
      if (output instanceof HTMLOutputElement) output.value = `${input.value}px`;
    });
    input.dispatchEvent(new Event('input'));
  });

  document.querySelectorAll('[data-lesson-action="hierarchy"]').forEach((button) => {
    button.addEventListener('click', () => {
      const demo = document.querySelector('[data-lesson-hierarchy]');
      if (!(demo instanceof HTMLElement) || !(button instanceof HTMLButtonElement)) return;
      const emphasized = demo.dataset.state !== 'emphasis';
      demo.dataset.state = emphasized ? 'emphasis' : 'flat';
      button.setAttribute('aria-pressed', String(emphasized));
      button.textContent = emphasized ? 'Return to uniform style' : 'Emphasize “SPACE”';
    });
  });

  document.querySelectorAll('[data-lesson-action="timing"]').forEach((button) => {
    button.addEventListener('click', () => {
      const track = document.querySelector('.type-timing-track');
      const feedback = document.querySelector('[data-lesson-timing-feedback]');
      if (!(track instanceof HTMLElement) || !(button instanceof HTMLButtonElement)) return;
      const compareEased = button.dataset.easing !== 'ease';
      button.dataset.easing = compareEased ? 'ease' : 'linear';
      button.setAttribute('aria-pressed', String(compareEased));
      track.style.setProperty('--lesson-easing', compareEased ? 'cubic-bezier(.2,.8,.2,1)' : 'linear');
      track.classList.remove('is-playing');
      void track.offsetWidth;
      track.classList.add('is-playing');
      if (feedback instanceof HTMLElement) {
        feedback.textContent = compareEased
          ? 'Now eased: notice the softer start and landing.'
          : 'Now linear: the dot moves at a constant rate.';
      }
      button.textContent = compareEased ? 'Replay linear motion' : 'Compare linear / eased';
    });
  });

  document.querySelectorAll('[data-lesson-action="readability"]').forEach((button) => {
    button.addEventListener('click', () => {
      const sample = document.querySelector('[data-lesson-reading]');
      if (!(sample instanceof HTMLElement) || !(button instanceof HTMLButtonElement)) return;
      const expressive = sample.classList.toggle('is-expressive');
      button.setAttribute('aria-pressed', String(expressive));
      button.textContent = expressive ? 'Return to restrained motion' : 'Add expressive motion';
    });
  });

  const typeExportStatus = document.querySelector('[data-type-export-status]');
  const typeStudioForExport = document.querySelector('[data-type-studio]');
  if (typeExportStatus instanceof HTMLElement && typeStudioForExport instanceof HTMLElement) {
    function getCurrentTypeComposition() {
      const text = typeStudioForExport.querySelector('[data-type-text]');
      const settings = [...typeStudioForExport.querySelectorAll('[data-type-setting]')];
      const composition = { text: text instanceof HTMLTextAreaElement ? text.value.slice(0, 48) : '' };
      settings.forEach((input) => {
        if ((input instanceof HTMLInputElement || input instanceof HTMLSelectElement) && input.dataset.typeSetting) {
          composition[input.dataset.typeSetting] = input.value;
        }
      });
      const modeButton = typeStudioForExport.querySelector('[data-type-mode][aria-pressed="true"]');
      const alignButton = typeStudioForExport.querySelector('[data-type-align][aria-pressed="true"]');
      const emphasisInput = typeStudioForExport.querySelector('[data-type-emphasis]');
      composition.mode = modeButton instanceof HTMLButtonElement ? modeButton.dataset.typeMode : 'flow';
      composition.align = alignButton instanceof HTMLButtonElement ? alignButton.dataset.typeAlign : 'center';
      composition.emphasis = emphasisInput instanceof HTMLInputElement && emphasisInput.checked;
      return composition;
    }

    function getPosterLines(context, text, maxWidth) {
      const paragraphs = text.split('\n');
      const lines = [];
      paragraphs.forEach((paragraph) => {
        const words = paragraph.split(/\s+/).filter(Boolean);
        let line = '';
        words.forEach((word) => {
          const candidate = line ? `${line} ${word}` : word;
          if (line && context.measureText(candidate).width > maxWidth) {
            lines.push(line);
            line = word;
          } else {
            line = candidate;
          }
        });
        lines.push(line);
      });
      return lines;
    }

    async function exportTypePoster() {
      const composition = getCurrentTypeComposition();
      if (!composition.text.trim()) {
        typeExportStatus.textContent = 'Add a few words to your composition before exporting.';
        return;
      }
      const portrait = document.querySelector('[data-type-poster-format]')?.value !== 'landscape';
      const canvas = document.createElement('canvas');
      canvas.width = portrait ? 1080 : 1350;
      canvas.height = portrait ? 1350 : 1080;
      const context = canvas.getContext('2d');
      if (!context) {
        typeExportStatus.textContent = 'Poster export is unavailable in this browser.';
        return;
      }
      const padding = Math.round(Number(composition.padding) * (canvas.width / 400));
      context.fillStyle = composition.paper;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = composition.ink;
      context.textAlign = composition.align;
      context.textBaseline = 'middle';
      const family = {
        display: 'Manrope, Arial, sans-serif',
        serif: 'Georgia, serif',
        sans: 'Arial, sans-serif',
        mono: '"Courier New", monospace'
      }[composition.font] || 'Arial, sans-serif';
      const maxWidth = canvas.width * (Number(composition.width) / 100);
      let fontSize = Math.round(Number(composition.size) * canvas.width / 400);
      let lines = [];
      do {
        context.font = `${composition.weight} ${fontSize}px ${family}`;
        lines = getPosterLines(context, composition.text, maxWidth);
        const heightFactor = composition.emphasis ? 1.36 + Math.max(0, lines.length - 1) * 0.68 : lines.length;
        if (heightFactor * fontSize * (Number(composition.leading) / 100) <= canvas.height - padding * 2) break;
        fontSize -= 2;
      } while (fontSize > 12);
      context.font = `${composition.weight} ${fontSize}px ${family}`;
      context.letterSpacing = `${Number(composition.tracking) * canvas.width / 400}px`;
      context.wordSpacing = `${Number(composition['word-spacing']) * canvas.width / 400}px`;
      const lineHeight = fontSize * (Number(composition.leading) / 100);
      const lineHeights = lines.map((_line, index) => lineHeight * (composition.emphasis ? (index === 0 ? 1.36 : 0.68) : 1));
      const centerY = canvas.height / 2;
      const totalHeight = lineHeights.reduce((total, height) => total + height, 0);
      let lineY = centerY - totalHeight / 2;
      const x = composition.align === 'left' ? padding
        : composition.align === 'right' ? canvas.width - padding
          : canvas.width / 2;
      lines.forEach((line, index) => {
        const lineScale = composition.emphasis ? (index === 0 ? 1.36 : 0.68) : 1;
        context.font = `${composition.weight} ${Math.round(fontSize * lineScale)}px ${family}`;
        context.fillText(line, x, lineY + lineHeights[index] / 2, maxWidth);
        lineY += lineHeights[index];
      });
      context.fillStyle = composition.ink;
      context.globalAlpha = 0.55;
      context.font = `700 ${Math.max(12, canvas.width * 0.012)}px Arial, sans-serif`;
      context.textAlign = 'left';
      context.fillText('TYPE IN MOTION  /  VALERE MBAYA', padding, canvas.height - padding * 0.42);
      context.globalAlpha = 1;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!(blob instanceof Blob)) {
        typeExportStatus.textContent = 'Poster export failed. Please try again.';
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'type-in-motion-poster.png';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      typeExportStatus.textContent = 'Poster downloaded as a PNG.';
    }

    function buildTypeCss(composition) {
      const family = {
        display: "'Manrope', Arial, sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
        sans: 'Arial, Helvetica, sans-serif',
        mono: "'Courier New', monospace"
      }[composition.font];
      const direction = composition.direction === '1' ? 'normal' : 'reverse';
      const modeDelay = composition.mode === 'flow' ? '.16' : composition.mode === 'scatter' ? '.14' : '1';
      const emphasisCss = composition.emphasis
        ? '\n.type-composition .type-preview-line:first-child { font-size: 1.36em; font-weight: 900; }\n.type-composition .type-preview-line:not(:first-child) { font-size: .68em; font-weight: 500; letter-spacing: .04em; }\n'
        : '';
      return `.type-composition {
    --type-intensity: ${composition.intensity};
    --type-stagger: ${composition.stagger}ms;
    font-family: ${family};
    font-size: ${composition.size}px;
    font-weight: ${composition.weight};
    line-height: ${(Number(composition.leading) / 100).toFixed(2)};
    letter-spacing: ${composition.tracking}px;
    word-spacing: ${composition['word-spacing']}px;
    text-align: ${composition.align};
    color: ${composition.ink};
    background: ${composition.paper};
    max-width: ${composition.width}%;
    padding: ${composition.padding}px;
}

/* Use .type-preview-line for each line and .type-letter for each character. */
.type-composition .type-letter {
    display: inline-block;
    animation: type-${composition.mode} ${composition.speed}s ${composition.easing} infinite;
    animation-delay: calc(var(--type-index, 0) * var(--type-stagger) * ${modeDelay} * ${direction === 'normal' ? '1' : '-1'});
    animation-direction: ${direction};
}
${emphasisCss}
@keyframes type-flow {
    from { transform: translateX(calc(var(--type-intensity) * -.05px)) skewX(-4deg); }
    to { transform: translateX(calc(var(--type-intensity) * .05px)) skewX(4deg); }
}
@keyframes type-bounce {
    0%, 100% { transform: translateY(0) scaleY(1); }
    38% { transform: translateY(calc(var(--type-intensity) * -.15px)) scaleY(1.05); }
    58% { transform: translateY(2px) scaleY(.97); }
}
@keyframes type-scatter {
    0%, 20% { transform: translate(0,0) rotate(0); }
    70%, 100% { transform: translate(calc(var(--type-x,0) * 1px), calc(var(--type-y,0) * 1px)) rotate(calc(var(--type-rotate,0) * 1deg)); }
}
@keyframes type-wave {
    0%, 100% { transform: translateY(0) rotate(0); }
    25% { transform: translateY(calc(var(--type-intensity) * -.12px)) rotate(-3deg); }
    75% { transform: translateY(calc(var(--type-intensity) * .12px)) rotate(3deg); }
}`;
    }

    async function copyTypeText(value, successMessage) {
      try {
        await navigator.clipboard.writeText(value);
        typeExportStatus.textContent = successMessage;
      } catch (error) {
        console.error('Unable to copy typography settings:', error);
        typeExportStatus.textContent = 'Clipboard access failed. Check browser permissions and try again.';
      }
    }

    document.querySelector('[data-type-action="poster"]')?.addEventListener('click', exportTypePoster);
    document.querySelector('[data-type-action="copy-css"]')?.addEventListener('click', () => {
      copyTypeText(buildTypeCss(getCurrentTypeComposition()), 'CSS settings copied. Paste them into your stylesheet.');
    });
    document.querySelector('[data-type-action="share"]')?.addEventListener('click', () => {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('type', JSON.stringify(getCurrentTypeComposition()));
      if (currentUrl.href.length > 2000) {
        typeExportStatus.textContent = 'This composition makes a long link. Shorten the text or phrase, then try again.';
        return;
      }
      copyTypeText(currentUrl.href, 'Share link copied. It opens with these settings ready to explore.');
    });
  }

  const requestInspector = document.querySelector('[data-request-inspector]');
  if (requestInspector instanceof HTMLElement) {
    const methodSelect = requestInspector.querySelector('[data-request-method]');
    const pathInput = requestInspector.querySelector('[data-request-path]');
    const paramsInput = requestInspector.querySelector('[data-request-params]');
    const headersInput = requestInspector.querySelector('[data-request-headers]');
    const bodyInput = requestInspector.querySelector('[data-request-body]');
    const bodyWrap = requestInspector.querySelector('[data-request-body-wrap]');
    const sendButton = requestInspector.querySelector('[data-request-send]');
    const requestError = requestInspector.querySelector('[data-request-error]');
    const fullUrlLabel = requestInspector.querySelector('[data-request-full-url]');
    const statusBadge = requestInspector.querySelector('[data-request-status]');
    const statusValue = requestInspector.querySelector('[data-request-status-value]');
    const statusText = requestInspector.querySelector('[data-request-status-text]');
    const durationOutput = requestInspector.querySelector('[data-request-duration]');
    const sizeOutput = requestInspector.querySelector('[data-request-size]');
    const bodyType = requestInspector.querySelector('[data-request-body-type]');
    const jsonContainer = requestInspector.querySelector('[data-request-json]');
    const rawContainer = requestInspector.querySelector('[data-request-raw]');
    const rawToggle = requestInspector.querySelector('[data-request-raw-toggle]');
    const copyButton = requestInspector.querySelector('[data-request-copy]');
    const searchInput = requestInspector.querySelector('[data-request-search]');
    const responseHeaders = requestInspector.querySelector('[data-request-response-headers]');
    const journey = requestInspector.querySelector('[data-request-journey]');
    const explanation = requestInspector.querySelector('[data-request-explanation]');
    const liveStatus = requestInspector.querySelector('[data-request-live-status]');
    const pinButton = requestInspector.querySelector('[data-request-compare-pin]');
    const comparison = requestInspector.querySelector('[data-request-comparison]');
    const challengeId = document.querySelector('[data-request-challenge-id]');
    const challengeButton = document.querySelector('[data-request-challenge-check]');
    const challengeResult = document.querySelector('[data-request-challenge-result]');
    const responseTabs = [...requestInspector.querySelectorAll('[data-response-tab]')];
    const responsePanels = [...requestInspector.querySelectorAll('[data-response-panel]')];

    if (methodSelect instanceof HTMLSelectElement && pathInput instanceof HTMLInputElement
      && paramsInput instanceof HTMLTextAreaElement && headersInput instanceof HTMLTextAreaElement
      && bodyInput instanceof HTMLTextAreaElement && bodyWrap instanceof HTMLElement
      && sendButton instanceof HTMLButtonElement && requestError instanceof HTMLElement
      && fullUrlLabel instanceof HTMLElement && statusBadge instanceof HTMLElement
      && statusValue instanceof HTMLElement && statusText instanceof HTMLElement
      && durationOutput instanceof HTMLElement && sizeOutput instanceof HTMLElement
      && bodyType instanceof HTMLElement && jsonContainer instanceof HTMLElement
      && rawContainer instanceof HTMLPreElement && rawToggle instanceof HTMLButtonElement
      && copyButton instanceof HTMLButtonElement && searchInput instanceof HTMLInputElement
      && responseHeaders instanceof HTMLElement && journey instanceof HTMLOListElement
      && explanation instanceof HTMLElement && liveStatus instanceof HTMLElement
      && pinButton instanceof HTMLButtonElement && comparison instanceof HTMLElement
      && challengeId instanceof HTMLInputElement && challengeButton instanceof HTMLButtonElement
      && challengeResult instanceof HTMLElement) {
      const apiOrigin = 'https://jsonplaceholder.typicode.com';
      const allowedPath = /^\/(?:posts|users|comments)(?:\/\d+)?$/;
      const blockedHeaders = new Set([
        'authorization', 'proxy-authorization', 'cookie', 'cookie2', 'set-cookie',
        'host', 'origin', 'referer', 'content-length', 'connection', 'x-api-key', 'api-key'
      ]);
      const responseLimit = 1024 * 1024;
      let activeController = null;
      let lastResponse = null;
      let pinnedResponse = null;
      let latestBodyText = '';

      const examples = {
        single: { method: 'GET', path: '/posts/1', params: '', body: '' },
        query: { method: 'GET', path: '/posts', params: 'userId=1', body: '' },
        user: { method: 'GET', path: '/users/1', params: '', body: '' },
        create: {
          method: 'POST',
          path: '/posts',
          params: '',
          body: '{\n  "title": "A small request",\n  "body": "Inspect what the server returns.",\n  "userId": 1\n}'
        },
        missing: { method: 'GET', path: '/posts/999999', params: '', body: '' }
      };

      function setRequestLiveStatus(message, state = 'info') {
        liveStatus.textContent = message;
        liveStatus.dataset.state = state;
      }

      function updateUrlPreview() {
        const suffix = paramsInput.value.trim()
          ? `?${paramsInput.value.trim().split(/\r?\n/).filter(Boolean).join('&')}`
          : '';
        fullUrlLabel.textContent = `${pathInput.value.trim()}${suffix}`;
        const isPost = methodSelect.value === 'POST';
        bodyWrap.hidden = !isPost;
      }

      function markJourney(step, elapsed) {
        const item = journey.querySelector(`[data-journey-step="${step}"]`);
        if (!(item instanceof HTMLLIElement)) return;
        item.dataset.state = 'done';
        const time = item.querySelector('time');
        if (time instanceof HTMLTimeElement) time.textContent = `${elapsed.toFixed(1)} ms`;
      }

      function resetJourney() {
        journey.querySelectorAll('[data-journey-step]').forEach((item) => {
          item.dataset.state = 'pending';
          const time = item.querySelector('time');
          if (time instanceof HTMLTimeElement) time.textContent = '—';
        });
      }

      function parseLines(text, label) {
        return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
          const separator = line.indexOf('=');
          if (label === 'header') {
            const colon = line.indexOf(':');
            if (colon < 1) throw new Error(`Use “Name: value” for each ${label}.`);
            const name = line.slice(0, colon).trim();
            const value = line.slice(colon + 1).trim();
            if (blockedHeaders.has(name.toLowerCase()) || /(?:authorization|api[-_]?key|auth|token|secret|credential)/i.test(name)) {
              throw new Error(`The ${name} header is restricted in this public demo.`);
            }
            if (!/^[!#$%&'*+.^_`|~\da-z-]+$/i.test(name)) throw new Error(`“${name}” is not a valid header name.`);
            return [name, value];
          }
          if (separator < 1) throw new Error(`Use “key=value” for each query parameter.`);
          const key = line.slice(0, separator).trim();
          const value = line.slice(separator + 1).trim();
          if (!key || /[\u0000-\u001f]/.test(key + value)) throw new Error('Query parameters cannot be empty or contain control characters.');
          return [key, value];
        });
      }

      function validateRequest() {
        if (!['GET', 'POST'].includes(methodSelect.value)) throw new Error('Choose GET or POST.');
        const path = pathInput.value.trim();
        if (!path.startsWith('/') || path.startsWith('//') || path.includes('?') || path.includes('#')) {
          throw new Error('Enter a path beginning with “/”. Put query parameters in the parameters field.');
        }
        const requestUrl = new URL(path, apiOrigin);
        if (requestUrl.origin !== apiOrigin || requestUrl.username || requestUrl.password
          || !allowedPath.test(requestUrl.pathname)) {
          throw new Error('This workbench only sends requests to /posts, /users, or /comments and their numeric records.');
        }
        if (methodSelect.value === 'POST' && requestUrl.pathname !== '/posts') {
          throw new Error('POST is enabled only for /posts on the test API.');
        }
        const parameters = parseLines(paramsInput.value, 'parameter');
        if (parameters.length > 30) throw new Error('Use no more than 30 query parameters.');
        parameters.forEach(([key, value]) => requestUrl.searchParams.append(key, value));
        const headers = new Headers();
        parseLines(headersInput.value, 'header').forEach(([name, value]) => {
          try {
            headers.append(name, value);
          } catch {
            throw new Error(`The “${name}” header value is not valid.`);
          }
        });
        if (!headers.has('Accept')) headers.set('Accept', 'application/json');
        let body;
        if (methodSelect.value === 'POST') {
          try {
            body = JSON.stringify(JSON.parse(bodyInput.value));
          } catch {
            throw new Error('The request body must be valid JSON.');
          }
          if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
        }
        return { url: requestUrl, headers, body };
      }

      function appendJsonValue(parent, key, value, path, level = 0) {
        const entry = document.createElement('div');
        entry.className = 'request-json-entry';
        entry.dataset.search = `${key} ${path}`.toLowerCase();
        const keyLabel = document.createElement('span');
        keyLabel.className = 'request-json-key';
        keyLabel.textContent = key;
        const punctuation = document.createElement('span');
        punctuation.className = 'request-json-punctuation';
        punctuation.textContent = ': ';
        entry.append(keyLabel, punctuation);

        if (value !== null && typeof value === 'object') {
          const isArray = Array.isArray(value);
          const entries = Object.entries(value);
          const details = document.createElement('details');
          details.className = 'request-json-node';
          details.open = level < 1;
          const summary = document.createElement('summary');
          summary.append(entry);
          const countLabel = document.createElement('span');
          countLabel.className = 'request-json-punctuation';
          countLabel.textContent = isArray ? `[${entries.length}]` : `{${entries.length}}`;
          summary.append(countLabel);
          details.append(summary);
          entries.slice(0, 500).forEach(([childKey, childValue]) => {
            appendJsonValue(details, isArray ? `[${childKey}]` : childKey, childValue, `${path}.${childKey}`, level + 1);
          });
          if (entries.length > 500) {
            const truncated = document.createElement('p');
            truncated.textContent = `Showing 500 of ${entries.length} values.`;
            details.append(truncated);
          }
          parent.append(details);
          return;
        }

        entry.classList.add('request-json-leaf');
        const valueLabel = document.createElement('span');
        if (typeof value === 'string') {
          valueLabel.className = 'request-json-string';
          valueLabel.textContent = JSON.stringify(value);
        } else if (typeof value === 'number') {
          valueLabel.className = 'request-json-number';
          valueLabel.textContent = String(value);
        } else {
          valueLabel.className = value === null ? 'request-json-null' : 'request-json-boolean';
          valueLabel.textContent = String(value);
        }
        entry.dataset.search += ` ${String(value)}`.toLowerCase();
        entry.append(valueLabel);
        parent.append(entry);
      }

      function renderJsonTree(value, emptyMessage = 'This response did not contain a readable body.') {
        jsonContainer.replaceChildren();
        if (value === undefined) {
          const empty = document.createElement('p');
          empty.className = 'request-empty-state';
          empty.textContent = emptyMessage;
          jsonContainer.append(empty);
          return;
        }
        appendJsonValue(jsonContainer, Array.isArray(value) ? 'Response array' : 'Response', value, '$');
        applyResponseSearch();
      }

      function applyResponseSearch() {
        const query = searchInput.value.trim().toLowerCase();
        jsonContainer.querySelectorAll('.request-json-leaf').forEach((leaf) => {
          leaf.hidden = Boolean(query) && !leaf.textContent.toLowerCase().includes(query)
            && !(leaf instanceof HTMLElement && leaf.dataset.search?.includes(query));
        });
        jsonContainer.querySelectorAll('.request-json-node').forEach((node) => {
          const matchingChild = [...node.querySelectorAll('.request-json-leaf')].some((leaf) => !leaf.hasAttribute('hidden'));
          const ownMatch = node.querySelector(':scope > summary')?.textContent.toLowerCase().includes(query);
          node.hidden = Boolean(query) && !matchingChild && !ownMatch;
          if (query && !node.hidden) node.open = true;
        });
      }

      function getStatusInfo(status) {
        if (status >= 200 && status < 300) {
          if (status === 201) return ['Created', 'The server reported that it created a resource. On JSONPlaceholder, POST responses are simulated and are not permanently saved.'];
          return ['OK', 'The server returned a successful status. Check the body too: a successful status alone does not confirm the data matches what your application expected.'];
        }
        const known = {
          400: ['Bad Request', 'The server rejected the request. Review its response body, query parameters, and payload; this status alone does not identify which field is wrong.'],
          401: ['Unauthorized', 'The server requires acceptable authentication. This response does not prove a password is incorrect. This public workbench does not accept credentials.'],
          403: ['Forbidden', 'The server understood the request but declined to fulfill it. The status alone does not say which permission or policy applied.'],
          404: ['Not Found', 'The server did not find a matching resource at this path. Check the endpoint and record ID.'],
          429: ['Too Many Requests', 'The server is limiting requests. Check readable retry or rate-limit headers before trying again.'],
          500: ['Internal Server Error', 'The server reported an error while handling the request. A client cannot infer the underlying cause from this status alone.']
        };
        return known[status] || [`HTTP ${status}`, status >= 400
          ? 'The server returned an error status. Inspect the response body and headers for details; the status alone may not reveal the cause.'
          : 'The server returned this HTTP status. Inspect the body and headers to understand what the endpoint provided.'];
      }

      function renderExplanation(responseRecord) {
        const [label, message] = getStatusInfo(responseRecord.status);
        const heading = document.createElement('strong');
        heading.textContent = `HTTP ${responseRecord.status} ${label}`;
        const detail = document.createElement('p');
        detail.textContent = message;
        const context = document.createElement('p');
        const contentType = responseRecord.headers['content-type'] || 'not exposed';
        context.textContent = `Observed content type: ${contentType}. ${responseRecord.isJson ? 'The body was parsed as JSON.' : 'The body was not valid JSON.'}`;
        explanation.replaceChildren(heading, detail, context);
      }

      const headerNotes = {
        'content-type': 'Describes the format of the response body.',
        'cache-control': 'Describes caching rules that clients and intermediaries should follow.',
        etag: 'A validator that can help clients ask whether a resource changed.',
        date: 'The date and time the server says it generated the response.',
        'content-length': 'The byte length reported by the server, when exposed.',
        'retry-after': 'A suggested delay before retrying, often relevant to rate limiting.',
        'access-control-allow-origin': 'A CORS response header; it does not make every other response header readable.'
      };

      function renderHeaders(headers) {
        const list = document.createElement('dl');
        list.className = 'request-response-header-list';
        const entries = Object.entries(headers);
        if (entries.length === 0) {
          const empty = document.createElement('p');
          empty.className = 'request-empty-state';
          empty.textContent = 'No response headers were readable.';
          responseHeaders.replaceChildren(empty);
          return;
        }
        entries.forEach(([name, value]) => {
          const term = document.createElement('dt');
          term.textContent = name;
          const description = headerNotes[name.toLowerCase()];
          if (description) term.title = description;
          const detail = document.createElement('dd');
          detail.textContent = value;
          if (description) {
            const note = document.createElement('span');
            note.className = 'request-header-note';
            note.textContent = description;
            detail.append(note);
          }
          list.append(term, detail);
        });
        responseHeaders.replaceChildren(list);
      }

      function flattenJson(value, prefix = '$', result = new Map(), limit = 500) {
        if (result.size >= limit) return result;
        if (value !== null && typeof value === 'object') {
          Object.entries(value).forEach(([key, child]) => {
            if (result.size < limit) flattenJson(child, Array.isArray(value) ? `${prefix}[${key}]` : `${prefix}.${key}`, result, limit);
          });
        } else {
          result.set(prefix, value);
        }
        return result;
      }

      function compareResponses(first, second) {
        const firstFields = flattenJson(first.json);
        const secondFields = flattenJson(second.json);
        const allPaths = new Set([...firstFields.keys(), ...secondFields.keys()]);
        const changes = [];
        allPaths.forEach((path) => {
          const inFirst = firstFields.has(path);
          const inSecond = secondFields.has(path);
          if (!inFirst) changes.push({ path, change: 'added', before: undefined, after: secondFields.get(path) });
          else if (!inSecond) changes.push({ path, change: 'removed', before: firstFields.get(path), after: undefined });
          else if (JSON.stringify(firstFields.get(path)) !== JSON.stringify(secondFields.get(path))) {
            changes.push({ path, change: 'changed', before: firstFields.get(path), after: secondFields.get(path) });
          }
        });
        return changes.slice(0, 100);
      }

      function renderComparison(first, second) {
        if (!first || !second) return;
        const grid = document.createElement('div');
        grid.className = 'request-comparison-grid';
        [
          { label: 'PINNED RESPONSE', response: first },
          { label: 'LATEST RESPONSE', response: second }
        ].forEach(({ label, response }) => {
          const card = document.createElement('div');
          card.className = 'request-comparison-card';
          const title = document.createElement('h4');
          title.textContent = label;
          const endpoint = document.createElement('p');
          endpoint.textContent = `${response.method} ${response.url}`;
          const status = document.createElement('p');
          status.textContent = `HTTP ${response.status} · ${response.duration.toFixed(1)} ms · ${response.size} bytes`;
          card.append(title, endpoint, status);
          grid.append(card);
        });
        const changes = compareResponses(first, second);
        const list = document.createElement('ul');
        list.className = 'request-diff-list';
        if (changes.length === 0) {
          const same = document.createElement('li');
          same.textContent = 'No JSON field changes found in the readable bodies.';
          list.append(same);
        } else {
          changes.forEach((item) => {
            const row = document.createElement('li');
            row.dataset.change = item.change;
            const before = item.before === undefined ? '—' : JSON.stringify(item.before);
            const after = item.after === undefined ? '—' : JSON.stringify(item.after);
            row.textContent = `${item.change.toUpperCase()} ${item.path} · ${before} → ${after}`;
            list.append(row);
          });
        }
        grid.append(list);
        comparison.replaceChildren(grid);
      }

      function selectResponseTab(name) {
        responseTabs.forEach((tab) => {
          const selected = tab.dataset.responseTab === name;
          tab.setAttribute('aria-selected', String(selected));
        });
        responsePanels.forEach((panel) => {
          panel.hidden = panel.dataset.responsePanel !== name;
        });
      }

      function formatSize(size) {
        return size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`;
      }

      async function readResponseBody(response, controller) {
        if (!response.body) return '';
        const reader = response.body.getReader();
        const chunks = [];
        let size = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > responseLimit) {
            await reader.cancel();
            controller.abort();
            throw new Error('Response exceeded the 1 MB safety limit and was stopped.');
          }
          chunks.push(value);
        }
        const combined = new Uint8Array(size);
        let offset = 0;
        chunks.forEach((chunk) => {
          combined.set(chunk, offset);
          offset += chunk.byteLength;
        });
        return new TextDecoder().decode(combined);
      }

      function showRequestError(error, elapsed) {
        const message = error instanceof Error ? error.message : 'An unexpected request error occurred.';
        statusBadge.textContent = 'No response';
        statusBadge.dataset.state = 'error';
        statusValue.textContent = '—';
        statusText.textContent = 'No readable HTTP response';
        durationOutput.textContent = `${elapsed.toFixed(0)} ms`;
        sizeOutput.textContent = '—';
        requestError.textContent = message.includes('Failed to fetch') || message.includes('NetworkError')
          ? 'The browser could not read a response. The API may be unavailable or CORS may have blocked access; this is not an HTTP status code.'
          : message;
        requestError.hidden = false;
        latestBodyText = '';
        rawContainer.textContent = '';
        rawContainer.hidden = true;
        rawToggle.hidden = true;
        jsonContainer.hidden = false;
        copyButton.disabled = true;
        const [label, detail] = ['Network or browser error', message];
        const title = document.createElement('strong');
        title.textContent = label;
        const text = document.createElement('p');
        text.textContent = detail.includes('Failed to fetch')
          ? 'Fetch did not provide readable response headers. Check the network connection or API CORS policy; browser security prevents this page from inspecting the blocked response.'
          : detail;
        explanation.replaceChildren(title, text);
        renderJsonTree(undefined, 'No response body could be read.');
        renderHeaders({});
        setRequestLiveStatus(requestError.textContent, 'error');
      }

      async function sendRequest() {
        if (activeController) activeController.abort();
        requestError.hidden = true;
        const requestButtonText = sendButton.textContent;
        sendButton.disabled = true;
        sendButton.textContent = 'Sending…';
        statusBadge.textContent = 'Sending';
        statusBadge.dataset.state = 'pending';
        statusValue.textContent = '…';
        statusText.textContent = 'Waiting for server';
        durationOutput.textContent = '—';
        sizeOutput.textContent = '—';
        latestBodyText = '';
        rawContainer.textContent = '';
        rawContainer.hidden = true;
        rawToggle.hidden = true;
        jsonContainer.hidden = false;
        copyButton.disabled = true;
        bodyType.textContent = 'Response JSON';
        renderJsonTree(undefined, 'Waiting for a response body.');
        renderHeaders({});
        const pendingTitle = document.createElement('strong');
        pendingTitle.textContent = 'Request in progress';
        const pendingText = document.createElement('p');
        pendingText.textContent = 'Waiting for the server to respond.';
        explanation.replaceChildren(pendingTitle, pendingText);
        resetJourney();
        const start = performance.now();
        let request;
        try {
          request = validateRequest();
        } catch (error) {
          requestError.textContent = error instanceof Error ? error.message : 'The request could not be validated.';
          requestError.hidden = false;
          statusBadge.textContent = 'Not sent';
          statusBadge.removeAttribute('data-state');
          statusValue.textContent = '—';
          statusText.textContent = 'Request not sent';
          durationOutput.textContent = '—';
          sizeOutput.textContent = '—';
          renderJsonTree(undefined, 'No response body; request validation failed.');
          sendButton.disabled = false;
          sendButton.textContent = requestButtonText;
          setRequestLiveStatus('Request validation failed. Nothing was sent.', 'error');
          return null;
        }

        const controller = new AbortController();
        activeController = controller;
        const timeoutId = window.setTimeout(() => controller.abort('Request timed out after 10 seconds.'), 10000);
        const requestMethod = methodSelect.value;
        const init = { method: requestMethod, headers: request.headers, signal: controller.signal, mode: 'cors', credentials: 'omit', redirect: 'error' };
        if (requestMethod === 'POST') init.body = request.body;
        markJourney('prepared', performance.now() - start);
        setRequestLiveStatus(`Sending ${requestMethod} request to ${request.url.pathname}…`);
        markJourney('sent', performance.now() - start);
        try {
          const response = await fetch(request.url.href, init);
          const headersAt = performance.now();
          markJourney('headers', headersAt - start);
          const responseText = await readResponseBody(response, controller);
          const completedAt = performance.now();
          markJourney('body', completedAt - start);
          const responseHeadersObject = Object.fromEntries(response.headers.entries());
          let json;
          let isJson = false;
          try {
            json = responseText ? JSON.parse(responseText) : null;
            isJson = true;
          } catch {
            json = undefined;
          }
          const responseRecord = {
            method: requestMethod,
            url: request.url.href,
            status: response.status,
            statusText: response.statusText,
            duration: completedAt - start,
            headerDuration: headersAt - start,
            size: new TextEncoder().encode(responseText).byteLength,
            headers: responseHeadersObject,
            body: responseText,
            json,
            isJson,
            ok: response.ok
          };
          lastResponse = responseRecord;
          latestBodyText = responseText;
          statusBadge.textContent = `HTTP ${response.status}`;
          statusBadge.dataset.state = response.ok ? 'success' : 'error';
          statusValue.textContent = String(response.status);
          statusText.textContent = response.statusText || 'HTTP response received';
          durationOutput.textContent = `${responseRecord.duration.toFixed(0)} ms`;
          sizeOutput.textContent = formatSize(responseRecord.size);
          bodyType.textContent = isJson ? 'Response JSON' : 'Response text';
          copyButton.textContent = isJson ? 'Copy JSON' : 'Copy response';
          rawContainer.textContent = isJson ? JSON.stringify(json, null, 2) : responseText;
          rawToggle.hidden = !responseText;
          rawToggle.textContent = isJson ? 'Show raw JSON' : 'Show response text';
          rawContainer.hidden = true;
          jsonContainer.hidden = false;
          copyButton.disabled = !responseText;
          if (isJson) {
            renderJsonTree(json);
          } else {
            const textMessage = document.createElement('p');
            textMessage.className = 'request-empty-state';
            textMessage.textContent = 'This response is not JSON. Show the response text to read it.';
            jsonContainer.replaceChildren(textMessage);
          }
          renderHeaders(responseHeadersObject);
          renderExplanation(responseRecord);
          if (pinnedResponse) {
            renderComparison(pinnedResponse, responseRecord);
            requestInspector.querySelector('[data-response-tab="compare"]').removeAttribute('disabled');
          }
          pinButton.disabled = false;
          setRequestLiveStatus(`Received HTTP ${response.status} in ${responseRecord.duration.toFixed(0)} ms. ${isJson ? 'JSON parsed successfully.' : 'Response was not JSON.'}`, response.ok ? 'success' : 'error');
          return responseRecord;
        } catch (error) {
          const elapsed = performance.now() - start;
          if (controller.signal.aborted && elapsed >= 9900) {
            showRequestError(new Error('The request timed out after 10 seconds. Check the network and try again.'), elapsed);
          } else {
            showRequestError(error, elapsed);
          }
          return null;
        } finally {
          window.clearTimeout(timeoutId);
          if (activeController === controller) activeController = null;
          sendButton.disabled = false;
          sendButton.textContent = requestButtonText;
        }
      }

      function setExample(name) {
        const example = examples[name];
        if (!example) return;
        methodSelect.value = example.method;
        pathInput.value = example.path;
        paramsInput.value = example.params;
        headersInput.value = 'Accept: application/json';
        bodyInput.value = example.body;
        updateUrlPreview();
        requestError.hidden = true;
        setRequestLiveStatus(`${example.method} ${example.path} is ready. Send it to see the real response.`);
      }

      methodSelect.addEventListener('change', updateUrlPreview);
      pathInput.addEventListener('input', updateUrlPreview);
      paramsInput.addEventListener('input', updateUrlPreview);
      sendButton.addEventListener('click', () => sendRequest());
      document.querySelectorAll('[data-request-example]').forEach((button) => {
        button.addEventListener('click', () => {
          if (button instanceof HTMLButtonElement && button.dataset.requestExample) setExample(button.dataset.requestExample);
        });
      });

      responseTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
          if (tab instanceof HTMLButtonElement && !tab.disabled && tab.dataset.responseTab) selectResponseTab(tab.dataset.responseTab);
        });
        tab.addEventListener('keydown', (event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          const direction = event.key === 'ArrowRight' ? 1 : -1;
          let nextIndex = index;
          do {
            nextIndex = (nextIndex + direction + responseTabs.length) % responseTabs.length;
          } while (responseTabs[nextIndex].disabled && nextIndex !== index);
          responseTabs[nextIndex].focus();
          if (responseTabs[nextIndex].dataset.responseTab) selectResponseTab(responseTabs[nextIndex].dataset.responseTab);
        });
      });

      searchInput.addEventListener('input', applyResponseSearch);
      rawToggle.addEventListener('click', () => {
        const showRaw = rawContainer.hidden;
        rawContainer.hidden = !showRaw;
        jsonContainer.hidden = showRaw;
        rawToggle.textContent = showRaw ? 'Show JSON tree' : 'Show raw JSON';
      });
      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(latestBodyText);
          setRequestLiveStatus('Response body copied to the clipboard.', 'success');
        } catch (error) {
          console.error('Unable to copy the API response body:', error);
          setRequestLiveStatus('Clipboard access failed. Check browser permissions and try again.', 'error');
        }
      });
      pinButton.addEventListener('click', () => {
        if (!lastResponse) return;
        pinnedResponse = lastResponse;
        pinButton.textContent = 'Pinned · send another request';
        requestInspector.querySelector('[data-response-tab="compare"]').removeAttribute('disabled');
        if (lastResponse) {
          const title = document.createElement('p');
          title.className = 'request-empty-state';
          title.textContent = 'Pinned response saved. Send a different request to compare JSON fields.';
          comparison.replaceChildren(title);
        }
        setRequestLiveStatus('Response pinned. Change a path or parameter, then send another request.');
      });

      challengeButton.addEventListener('click', async () => {
        const id = Number(challengeId.value);
        if (!Number.isInteger(id) || id < 1 || id > 1000000) {
          challengeResult.textContent = 'Enter a whole-number post ID between 1 and 1,000,000.';
          challengeResult.dataset.state = 'error';
          return;
        }
        challengeButton.disabled = true;
        challengeButton.textContent = 'Checking live response…';
        methodSelect.value = 'GET';
        pathInput.value = `/posts/${id}`;
        paramsInput.value = '';
        headersInput.value = 'Accept: application/json';
        updateUrlPreview();
        const response = await sendRequest();
        challengeButton.disabled = false;
        challengeButton.textContent = 'Check my request ↗';
        if (!response) {
          challengeResult.textContent = 'No readable response arrived. Check the request result above; a network or CORS failure cannot count as completion.';
          challengeResult.dataset.state = 'error';
        } else if (response.status === 200 && response.json && Number(response.json.id) === id) {
          challengeResult.textContent = `Found it. The API returned post ${id} with HTTP 200. Try ID 999999 to compare a real 404.`;
          challengeResult.dataset.state = 'success';
        } else if (response.status === 404) {
          challengeResult.textContent = `HTTP 404 received for post ${id}. Try a different ID and check the response status again.`;
          challengeResult.dataset.state = 'error';
        } else {
          challengeResult.textContent = `The API returned HTTP ${response.status}. Try a post ID that exists and inspect the response body.`;
          challengeResult.dataset.state = 'error';
        }
      });

      updateUrlPreview();
      setExample('single');
    }
  }
}

(() => {
  const bench = document.querySelector('[data-json-bench]');
  if (!(bench instanceof HTMLElement)) return;
  const input = bench.querySelector('[data-json-input]');
  const lineNumbers = bench.querySelector('[data-json-lines]');
  const highlight = bench.querySelector('[data-json-highlight]');
  const validity = bench.querySelector('[data-json-validity]');
  const diagnostics = bench.querySelector('[data-json-diagnostics]');
  const output = bench.querySelector('[data-json-output]');
  const outputStatus = bench.querySelector('[data-json-output-status]');
  const outputSize = bench.querySelector('[data-json-output-size]');
  const indentSelect = bench.querySelector('[data-json-indent]');
  const tree = bench.querySelector('[data-json-tree]');
  const treeSearch = bench.querySelector('[data-json-tree-search]');
  const repairSummary = bench.querySelector('[data-json-repair-summary]');
  const repairOriginal = bench.querySelector('[data-json-repair-original]');
  const repairProposed = bench.querySelector('[data-json-repair-proposed]');
  const transformNote = bench.querySelector('[data-json-transform-note]');
  const selectedPanel = bench.querySelector('.json-selected-path');
  const selectedPathLabel = bench.querySelector('[data-json-selected-path]');
  const selectedTypeLabel = bench.querySelector('[data-json-selected-type]');
  const copyPathButton = bench.querySelector('[data-json-copy-path]');
  const copyValueButton = bench.querySelector('[data-json-copy-value]');
  const treeExpandButton = bench.querySelector('[data-json-tree-expand]');
  const treeCollapseButton = bench.querySelector('[data-json-tree-collapse]');
  const pathInput = bench.querySelector('[data-json-path]');
  const actionButtons = [...bench.querySelectorAll('[data-json-action]')];
  const tabs = [...bench.querySelectorAll('[data-json-tab]')];
  const views = [...bench.querySelectorAll('[data-json-view]')];
  const statOutputs = [...bench.querySelectorAll('[data-json-stat]')];
  if (!(input instanceof HTMLTextAreaElement) || !(lineNumbers instanceof HTMLElement)
    || !(highlight instanceof HTMLElement) || !(validity instanceof HTMLElement)
    || !(diagnostics instanceof HTMLElement) || !(output instanceof HTMLElement)
    || !(outputStatus instanceof HTMLElement) || !(outputSize instanceof HTMLElement)
    || !(indentSelect instanceof HTMLSelectElement) || !(tree instanceof HTMLElement)
    || !(treeSearch instanceof HTMLInputElement) || !(repairSummary instanceof HTMLElement)
    || !(repairOriginal instanceof HTMLElement) || !(repairProposed instanceof HTMLElement)
    || !(transformNote instanceof HTMLElement) || !(selectedPanel instanceof HTMLElement)
    || !(selectedPathLabel instanceof HTMLElement) || !(selectedTypeLabel instanceof HTMLElement)
    || !(copyPathButton instanceof HTMLButtonElement) || !(copyValueButton instanceof HTMLButtonElement)
    || !(treeExpandButton instanceof HTMLButtonElement) || !(treeCollapseButton instanceof HTMLButtonElement)
    || !(pathInput instanceof HTMLInputElement)) return;

  const sample = `{
  "name": "Nipe Connect",
  "active": true,
  "skills": ["Plumbing", "Electrical",],
  "wallet": {"balance": 2500}
}`;
  let parsed;
  let valid = false;
  let outputText = '';
  let outputKind = 'json';
  let repair = null;
  let selectedValue;
  let selectedPath = '';
  let hasSelectedValue = false;
  let treeNodes = 0;
  const treeLimit = 5000;
  const treeDepthLimit = 80;

  function status(message, state = 'info') {
    outputStatus.textContent = message;
    outputStatus.dataset.state = state;
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function syntaxHighlight(source, marked = new Set()) {
    if (source.length > 100000) {
      const positions = [...marked].filter((position) => position >= 0 && position < source.length).sort((a, b) => a - b);
      if (!positions.length) return escapeHtml(source);
      let highlighted = '';
      let cursor = 0;
      positions.forEach((position) => {
        if (position < cursor) return;
        highlighted += `${escapeHtml(source.slice(cursor, position))}<mark class="json-repair-change">${escapeHtml(source[position])}</mark>`;
        cursor = position + 1;
      });
      return highlighted + escapeHtml(source.slice(cursor));
    }
    const pattern = /("(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b|[{}\[\],:])/g;
    let result = '';
    let cursor = 0;
    let match = pattern.exec(source);
    while (match) {
      result += escapeHtml(source.slice(cursor, match.index));
      const token = match[0];
      const kind = token[0] === '"' ? (/^\s*:/.test(source.slice(match.index + token.length)) ? 'key' : 'string')
        : /^-?\d/.test(token) ? 'number'
          : token === 'true' || token === 'false' ? 'boolean'
            : token === 'null' ? 'null' : 'punctuation';
      const highlightedToken = `<span class="json-token-${kind}">${escapeHtml(token)}</span>`;
      result += marked.has(match.index) ? `<mark class="json-repair-change">${highlightedToken}</mark>` : highlightedToken;
      cursor = match.index + token.length;
      match = pattern.exec(source);
    }
    return result + escapeHtml(source.slice(cursor));
  }

  function syncEditor() {
    highlight.innerHTML = `${syntaxHighlight(input.value)}\n`;
    lineNumbers.textContent = Array.from({ length: input.value.split('\n').length }, (_, index) => String(index + 1)).join('\n');
    const count = bench.querySelector('[data-json-input-stats]');
    if (count) count.textContent = `${input.value.length.toLocaleString()} characters · ${input.value.split('\n').length.toLocaleString()} lines`;
    highlight.style.transform = `translate(${-input.scrollLeft}px, ${-input.scrollTop}px)`;
    lineNumbers.style.transform = `translateY(${-input.scrollTop}px)`;
  }

  function setDiagnostic(state, title, detail, location = '') {
    diagnostics.replaceChildren();
    diagnostics.dataset.state = state;
    const heading = document.createElement('strong');
    heading.textContent = location ? `${title} · ${location}` : title;
    const message = document.createElement('p');
    message.textContent = detail;
    diagnostics.append(heading, message);
  }

  function locationForError(message, source) {
    const match = message.match(/position\s+(\d+)/i);
    if (!match) return '';
    return locationAt(source, Number(match[1]));
  }

  function locationAt(source, offset) {
    const position = Math.min(offset, source.length);
    const prefix = source.slice(0, position);
    return `line ${prefix.split('\n').length}, column ${position - prefix.lastIndexOf('\n')}`;
  }

  function removeComments(source) {
    let result = '';
    let count = 0;
    let doubleString = false;
    let singleString = false;
    let escaped = false;
    for (let i = 0; i < source.length; i += 1) {
      const character = source[i];
      if (doubleString || singleString) {
        result += character;
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if ((doubleString && character === '"') || (singleString && character === "'")) {
          doubleString = false;
          singleString = false;
        }
        continue;
      }
      if (character === '"') {
        doubleString = true;
        result += character;
      } else if (character === "'") {
        singleString = true;
        result += character;
      } else if (character === '/' && source[i + 1] === '/') {
        count += 1;
        i += 2;
        while (i < source.length && source[i] !== '\n' && source[i] !== '\r') {
          result += ' ';
          i += 1;
        }
        if (i < source.length) result += source[i];
      } else if (character === '/' && source[i + 1] === '*') {
        const close = source.indexOf('*/', i + 2);
        if (close < 0) return { text: source, count: 0 };
        count += 1;
        for (let index = i; index < close + 2; index += 1) {
          result += source[index] === '\n' || source[index] === '\r' ? source[index] : ' ';
        }
        i = close + 1;
      } else {
        result += character;
      }
    }
    return { text: result, count };
  }

  function convertSingleQuotedStrings(source) {
    let result = '';
    let converted = 0;
    let inDoubleString = false;
    let escaped = false;
    for (let i = 0; i < source.length; i += 1) {
      const character = source[i];
      if (inDoubleString) {
        result += character;
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') inDoubleString = false;
        continue;
      }
      if (character === '"') {
        inDoubleString = true;
        result += character;
        continue;
      }
      if (character !== "'") {
        result += character;
        continue;
      }
      let replacement = '"';
      let closed = false;
      for (i += 1; i < source.length; i += 1) {
        const next = source[i];
        if (next === "'") {
          closed = true;
          break;
        }
        if (next === '\\') {
          const escapedCharacter = source[i + 1];
          if (!escapedCharacter) return null;
          if (escapedCharacter === "'") replacement += "'";
          else if (escapedCharacter === '"') replacement += '\\"';
          else if (escapedCharacter === '\\') replacement += '\\\\';
          else if ('/bfnrt'.includes(escapedCharacter)) replacement += `\\${escapedCharacter}`;
          else if (escapedCharacter === 'u' && /^[0-9a-f]{4}$/i.test(source.slice(i + 2, i + 6))) {
            replacement += `\\u${source.slice(i + 2, i + 6)}`;
            i += 4;
          } else return null;
          i += 1;
          continue;
        }
        if (next === '"' ) replacement += '\\"';
        else if (next.charCodeAt(0) < 0x20) return null;
        else replacement += next;
      }
      if (!closed) return null;
      result += `${replacement}"`;
      converted += 1;
    }
    return { text: result, count: converted };
  }

  function quoteUnquotedKeys(source) {
    let result = '';
    let quoted = 0;
    let inString = false;
    let escaped = false;
    const containers = [];
    for (let i = 0; i < source.length; i += 1) {
      const character = source[i];
      if (inString) {
        result += character;
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') {
        inString = true;
        result += character;
        continue;
      }
      const parent = containers[containers.length - 1];
      if (parent && parent.kind === 'object' && parent.expectKey && /[A-Za-z_$]/.test(character)) {
        const match = source.slice(i).match(/^[A-Za-z_$][\w$]*/);
        if (match && /^\s*:/.test(source.slice(i + match[0].length))) {
          result += JSON.stringify(match[0]);
          i += match[0].length - 1;
          quoted += 1;
          continue;
        }
      }
      result += character;
      if (character === '{') containers.push({ kind: 'object', expectKey: true });
      else if (character === '[') containers.push({ kind: 'array', expectKey: false });
      else if (character === '}' || character === ']') containers.pop();
      else if (character === ',' && parent?.kind === 'object') parent.expectKey = true;
      else if (character === ':' && parent?.kind === 'object') parent.expectKey = false;
    }
    return { text: result, count: quoted };
  }

  function trailingCommas(source) {
    const positions = [];
    let inString = false;
    let escaped = false;
    for (let i = 0; i < source.length; i += 1) {
      const character = source[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') inString = false;
      } else if (character === '"') inString = true;
      else if (character === ',') {
        let next = i + 1;
        while (next < source.length && /\s/.test(source[next])) next += 1;
        if (source[next] === ']' || source[next] === '}') positions.push(i);
      }
    }
    return positions;
  }

  function safeRepair(source) {
    const changes = [];
    const comments = removeComments(source);
    let candidate = comments.text;
    if (comments.count) changes.push(`Removed ${comments.count} ${comments.count === 1 ? 'comment' : 'comments'}`);
    const singleStrings = convertSingleQuotedStrings(candidate);
    if (singleStrings) {
      candidate = singleStrings.text;
      if (singleStrings.count) changes.push(`Converted ${singleStrings.count} single-quoted ${singleStrings.count === 1 ? 'string' : 'strings'}`);
      const keys = quoteUnquotedKeys(candidate);
      candidate = keys.text;
      if (keys.count) changes.push(`Quoted ${keys.count} unquoted ${keys.count === 1 ? 'key' : 'keys'}`);
    }
    const originalCommaPositions = candidate === source ? trailingCommas(candidate) : [];
    const positions = trailingCommas(candidate);
    if (positions.length) {
      positions.slice().reverse().forEach((position) => {
        candidate = `${candidate.slice(0, position)}${candidate.slice(position + 1)}`;
      });
      changes.push(`Removed ${positions.length} trailing ${positions.length === 1 ? 'comma' : 'commas'}`);
    }
    if (!changes.length) return null;
    try {
      JSON.parse(candidate);
      return { source, candidate, positions: originalCommaPositions, changes };
    } catch {
      return null;
    }
  }

  function updateRepair(nextRepair) {
    repair = nextRepair;
    const tab = bench.querySelector('[data-json-tab="repair"]');
    if (!(tab instanceof HTMLButtonElement)) return;
    tab.disabled = !repair;
    if (!repair) return;
    repairSummary.textContent = `${repair.changes.join('. ')}. The complete proposal passes JSON.parse().`;
    repairOriginal.innerHTML = syntaxHighlight(repair.source, new Set(repair.positions));
    repairProposed.innerHTML = syntaxHighlight(repair.candidate);
  }

  function byteSize(text) {
    const size = new TextEncoder().encode(text).byteLength;
    return size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`;
  }

  function updateStats(value, source) {
    let keys = 0;
    let arrays = 0;
    let depth = 1;
    const pending = [{ value, depth: 1 }];
    while (pending.length) {
      const item = pending.pop();
      depth = Math.max(depth, item.depth);
      if (Array.isArray(item.value)) {
        arrays += 1;
        item.value.forEach((child) => pending.push({ value: child, depth: item.depth + 1 }));
      } else if (item.value !== null && typeof item.value === 'object') {
        const entries = Object.entries(item.value);
        keys += entries.length;
        entries.forEach(([, child]) => pending.push({ value: child, depth: item.depth + 1 }));
      }
    }
    const stats = { keys, arrays, depth, size: byteSize(source) };
    statOutputs.forEach((element) => {
      const key = element.dataset.jsonStat;
      element.textContent = key && stats[key] !== undefined ? String(stats[key]) : '—';
    });
  }

  function disableTransformations(disabled) {
    ['sort', 'extract', 'csv'].forEach((name) => {
      const button = bench.querySelector(`[data-json-action="${name}"]`);
      if (!(button instanceof HTMLButtonElement)) return;
      const csvReady = Array.isArray(parsed) && parsed.length > 0
        && parsed.every((item) => item !== null && typeof item === 'object' && !Array.isArray(item))
        && parsed.some((item) => Object.keys(item).length > 0);
      button.disabled = disabled || (name === 'csv' && !csvReady);
    });
    treeExpandButton.disabled = disabled;
    treeCollapseButton.disabled = disabled;
  }

  function setOutput(text, kind = 'json', message = 'Output ready') {
    outputText = text;
    outputKind = kind;
    output.innerHTML = kind === 'json' ? syntaxHighlight(text) : escapeHtml(text);
    outputSize.textContent = byteSize(text);
    status(message, 'success');
    actionButtons.forEach((button) => {
      if (button.dataset.jsonAction === 'copy' || button.dataset.jsonAction === 'download') button.disabled = false;
    });
  }

  function clearOutput(message = 'Formatted or transformed JSON will appear here.') {
    outputText = '';
    outputKind = 'json';
    output.innerHTML = `<span class="json-output-placeholder">${escapeHtml(message)}</span>`;
    outputSize.textContent = '—';
    status('Waiting for JSON');
    actionButtons.forEach((button) => {
      if (button.dataset.jsonAction === 'copy' || button.dataset.jsonAction === 'download') button.disabled = true;
    });
  }

  function clearTreeSelection() {
    selectedValue = undefined;
    selectedPath = '';
    hasSelectedValue = false;
    selectedPanel.hidden = true;
    copyPathButton.disabled = true;
    copyValueButton.disabled = true;
  }

  function pathForChild(path, key, array) {
    if (array) return `${path}[${key}]`;
    return /^[A-Za-z_$][\w$]*$/.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`;
  }

  function addTreeNode(parent, key, value, path, depth) {
    if (treeNodes >= treeLimit) return;
    treeNodes += 1;
    const isBranch = value !== null && typeof value === 'object';
    const children = isBranch
      ? Array.isArray(value) ? value.map((child, index) => [String(index), child]) : Object.entries(value)
      : [];
    const node = document.createElement('div');
    node.className = 'json-tree-node';
    const row = document.createElement('div');
    row.className = 'json-tree-row';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'json-tree-toggle';
    toggle.textContent = isBranch ? depth === 0 ? '▾' : '▸' : '·';
    toggle.disabled = !isBranch || depth >= treeDepthLimit;
    toggle.setAttribute('aria-expanded', String(isBranch && depth === 0));
    const select = document.createElement('button');
    select.type = 'button';
    select.className = 'json-tree-select';
    select.dataset.path = path;
    const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    select.dataset.search = `${key} ${path} ${type} ${isBranch ? '' : String(value)}`.toLowerCase();
    const keyText = document.createElement('span');
    keyText.className = 'json-tree-key';
    keyText.textContent = key;
    select.append(keyText);
    const preview = document.createElement('span');
    preview.className = 'json-tree-preview';
    preview.textContent = isBranch ? `${type} · ${children.length} ${Array.isArray(value) ? 'items' : 'keys'}` : ': ';
    select.append(preview);
    if (!isBranch) {
      const scalar = document.createElement('span');
      scalar.className = 'json-tree-selected-value';
      scalar.dataset.type = type;
      scalar.textContent = typeof value === 'string' ? JSON.stringify(value) : String(value);
      select.append(scalar);
    }
    row.append(toggle, select);
    node.append(row);
    if (isBranch) {
      const nested = document.createElement('div');
      nested.className = 'json-tree-list';
      nested.hidden = depth !== 0;
      if (depth < treeDepthLimit) {
        for (const [childKey, child] of children) {
          if (treeNodes >= treeLimit) break;
          addTreeNode(nested, childKey, child, pathForChild(path, childKey, Array.isArray(value)), depth + 1);
        }
      } else if (children.length) {
        nested.textContent = `Tree expansion stops at ${treeDepthLimit} levels.`;
      }
      node.append(nested);
      toggle.addEventListener('click', () => {
        nested.hidden = !nested.hidden;
        toggle.textContent = nested.hidden ? '▸' : '▾';
        toggle.setAttribute('aria-expanded', String(!nested.hidden));
      });
    }
    select.addEventListener('click', () => {
      tree.querySelectorAll('.json-tree-select[aria-current="true"]').forEach((old) => old.removeAttribute('aria-current'));
      select.setAttribute('aria-current', 'true');
      selectedValue = value;
      selectedPath = path;
      hasSelectedValue = true;
      selectedPanel.hidden = false;
      selectedPathLabel.textContent = path;
      selectedTypeLabel.textContent = value === null ? 'null' : Array.isArray(value) ? `array · ${value.length} items` : typeof value;
      copyPathButton.disabled = false;
      copyValueButton.disabled = false;
    });
    parent.append(node);
  }

  function renderTree(value) {
    tree.replaceChildren();
    clearTreeSelection();
    treeNodes = 0;
    treeSearch.value = '';
    const root = document.createElement('div');
    root.className = 'json-tree-root';
    addTreeNode(root, 'root', value, '$', 0);
    tree.append(root);
    if (treeNodes >= treeLimit) {
      const note = document.createElement('p');
      note.className = 'json-bench-empty';
      note.textContent = `Tree limited to ${treeLimit.toLocaleString()} nodes for responsiveness.`;
      tree.append(note);
    }
    disableTransformations(false);
  }

  function inspect() {
    const source = input.value;
    updateRepair(null);
    parsed = undefined;
    valid = false;
    disableTransformations(true);
    if (!source.trim()) {
      validity.textContent = 'No input';
      validity.dataset.state = 'invalid';
      setDiagnostic('invalid', 'Add JSON to begin', 'Paste or type JSON in this editor. Nothing leaves this browser.');
      statOutputs.forEach((element) => { element.textContent = element.dataset.jsonStat === 'size' ? byteSize(source) : '—'; });
      tree.innerHTML = '<p class="json-bench-empty">Enter valid JSON to explore its structure.</p>';
      clearOutput();
      clearTreeSelection();
      return;
    }
    try {
      parsed = JSON.parse(source);
      valid = true;
      validity.textContent = 'Valid JSON';
      validity.dataset.state = 'valid';
      setDiagnostic('valid', 'Valid JSON', 'Syntax check passed. This does not validate field names or types against an API or schema.');
      updateStats(parsed, source);
      renderTree(parsed);
      clearOutput('Choose Format, Minify, or a data operation to create output.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The JSON parser rejected this input.';
      const proposal = safeRepair(source);
      const location = locationForError(message, source)
        || (proposal ? locationAt(source, proposal.positions[0]) : '');
      updateRepair(proposal);
      validity.textContent = 'Needs attention';
      validity.dataset.state = 'invalid';
      setDiagnostic('invalid', 'JSON syntax error', proposal
        ? `Parser: ${message}${location ? ` · ${location}` : ''}. Review the conservative repair proposal before applying it.`
        : `Parser: ${message}${location ? ` · ${location}` : ''}. No unambiguous supported repair was found; edit the input and validate again.`);
      statOutputs.forEach((element) => { element.textContent = element.dataset.jsonStat === 'size' ? byteSize(source) : '—'; });
      tree.innerHTML = '<p class="json-bench-empty">Tree explorer is available after the input parses as valid JSON.</p>';
      clearTreeSelection();
      clearOutput('Fix or validate the input to create output.');
    }
  }

  function selectTab(name) {
    tabs.forEach((tab) => {
      const active = tab.dataset.jsonTab === name;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    views.forEach((view) => { view.hidden = view.dataset.jsonView !== name; });
  }

  function sortJson(value) {
    const clone = (source) => Array.isArray(source) ? []
      : source !== null && typeof source === 'object' ? Object.create(null) : source;
    const root = clone(value);
    const pending = [{ source: value, target: root }];
    while (pending.length) {
      const { source, target } = pending.pop();
      const entries = Array.isArray(source)
        ? source.map((child, index) => [index, child])
        : source !== null && typeof source === 'object'
          ? Object.keys(source).sort((a, b) => a.localeCompare(b)).map((key) => [key, source[key]])
          : [];
      entries.forEach(([key, child]) => {
        const copied = clone(child);
        if (Array.isArray(target)) target[key] = copied;
        else Object.defineProperty(target, key, { value: copied, enumerable: true, configurable: true, writable: true });
        if (child !== null && typeof child === 'object') pending.push({ source: child, target: copied });
      });
    }
    return root;
  }

  function parseJsonPath(path) {
    if (!path.startsWith('$')) throw new Error('A JSON path must start with $.');
    const parts = [];
    let cursor = 1;
    while (cursor < path.length) {
      if (path[cursor] === '.') {
        const property = path.slice(cursor + 1).match(/^[A-Za-z_$][\w$]*/);
        if (!property) throw new Error(`Expected a property name after position ${cursor}.`);
        parts.push(property[0]);
        cursor += property[0].length + 1;
        continue;
      }
      if (path[cursor] !== '[') throw new Error(`Unexpected character at position ${cursor}.`);
      let closing = cursor + 1;
      let inString = false;
      let escaped = false;
      for (; closing < path.length; closing += 1) {
        const character = path[closing];
        if (inString) {
          if (escaped) escaped = false;
          else if (character === '\\') escaped = true;
          else if (character === '"') inString = false;
        } else if (character === '"') inString = true;
        else if (character === ']') break;
      }
      if (closing >= path.length) throw new Error('A bracket is missing its closing ].');
      const part = path.slice(cursor + 1, closing);
      if (/^(0|[1-9]\d*)$/.test(part)) parts.push(Number(part));
      else if (part.startsWith('"')) {
        try {
          const property = JSON.parse(part);
          if (typeof property !== 'string') throw new Error('not a string');
          parts.push(property);
        } catch {
          throw new Error('Use a valid JSON-quoted property name inside brackets.');
        }
      } else {
        throw new Error('Use an array index or a JSON-quoted property name inside brackets.');
      }
      cursor = closing + 1;
    }
    return parts;
  }

  function extractPathValue(value, path) {
    let current = value;
    for (const part of parseJsonPath(path)) {
      if (current === null || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, part)) {
        throw new Error(`No value exists at ${path}.`);
      }
      current = current[part];
    }
    return current;
  }

  function toCsv(value) {
    if (!Array.isArray(value) || value.length === 0 || !value.every((item) => item !== null && typeof item === 'object' && !Array.isArray(item))) {
      throw new Error('CSV conversion needs a non-empty array of objects.');
    }
    const columns = [...new Set(value.flatMap((item) => Object.keys(item)))];
    if (!columns.length) throw new Error('The objects do not contain any fields to export.');
    const cell = (item) => {
      const text = item === null || item === undefined ? '' : typeof item === 'object' ? JSON.stringify(item) : String(item);
      return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    return [columns, ...value.map((item) => columns.map((column) => item[column]))]
      .map((row) => row.map(cell).join(','))
      .join('\r\n');
  }

  function actionError(error) {
    const message = error instanceof Error ? error.message : 'The operation could not be completed.';
    status(message, 'error');
    transformNote.textContent = message;
  }

  function copyText(text, successMessage) {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
      status('Clipboard access is unavailable in this browser. Select the text and copy it manually.', 'error');
      return;
    }
    const reportCopyError = (error) => {
      console.error('Unable to copy JSON data:', error);
      status('Clipboard access failed. Select the output and copy it manually.', 'error');
    };
    try {
      navigator.clipboard.writeText(text).then(() => {
        status(successMessage, 'success');
      }).catch(reportCopyError);
    } catch (error) {
      reportCopyError(error);
    }
  }

  function runAction(action) {
    if (action === 'sample') {
      input.value = sample;
      syncEditor();
      inspect();
      status('Sample loaded. Review the safe trailing-comma proposal.', 'info');
      return;
    }
    if (action === 'clear') {
      if (input.value && !window.confirm('Clear the JSON input and current output?')) return;
      input.value = '';
      syncEditor();
      inspect();
      status('Input cleared.');
      return;
    }
    if (action === 'copy') {
      if (outputText) copyText(outputText, 'Output copied to the clipboard.');
      return;
    }
    if (action === 'download') {
      if (!outputText) return;
      const extension = outputKind === 'csv' ? 'csv' : 'json';
      const mimeType = outputKind === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8';
      try {
        const url = URL.createObjectURL(new Blob([outputText], { type: mimeType }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `json-repair-bench.${extension}`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        status(`Downloaded json-repair-bench.${extension}.`, 'success');
      } catch (error) {
        console.error('Unable to download JSON output:', error);
        status('The browser could not prepare the download. Copy the output instead.', 'error');
      }
      return;
    }
    if (action === 'repair') {
      inspect();
      if (!repair) {
        status('No safe automatic repair is available. The input was not changed.', 'error');
        return;
      }
      selectTab('repair');
      status('Review the proposed syntax repair before applying it.', 'success');
      return;
    }
    if (action === 'validate') {
      inspect();
      status(valid ? 'JSON is syntactically valid.' : 'Validation failed. Review the diagnostic and edit the input.', valid ? 'success' : 'error');
      return;
    }
    if (action === 'format' || action === 'minify') {
      inspect();
      if (!valid) {
        status('Cannot format invalid JSON. Fix the syntax or review a safe repair first.', 'error');
        return;
      }
      const indentation = indentSelect.value === 'tab' ? '\t' : Number(indentSelect.value);
      try {
        setOutput(JSON.stringify(parsed, null, action === 'format' ? indentation : undefined), 'json', action === 'format' ? 'Formatted JSON' : 'Minified JSON');
        selectTab('output');
      } catch (error) {
        actionError(error);
      }
      return;
    }
    if (!valid) {
      inspect();
      status('This transformation needs valid JSON. Check the syntax diagnostic.', 'error');
      return;
    }
    if (action === 'sort') {
      try {
        const indentation = indentSelect.value === 'tab' ? '\t' : Number(indentSelect.value);
        setOutput(JSON.stringify(sortJson(parsed), null, indentation), 'json', 'Keys sorted for display · confirm order requirements before using');
        transformNote.textContent = 'Object keys are sorted alphabetically in the output only. JSON objects are commonly treated as unordered; confirm requirements before relying on key order.';
        selectTab('output');
      } catch (error) {
        actionError(error);
      }
    } else if (action === 'extract') {
      try {
        const path = pathInput.value.trim();
        const value = extractPathValue(parsed, path);
        const indentation = indentSelect.value === 'tab' ? '\t' : Number(indentSelect.value);
        setOutput(JSON.stringify(value, null, indentation), 'json', `Extracted ${path}`);
        selectTab('output');
      } catch (error) {
        actionError(error);
      }
    } else if (action === 'csv') {
      try {
        setOutput(toCsv(parsed), 'csv', 'CSV generated · nested cell values are JSON-encoded');
        selectTab('output');
      } catch (error) {
        actionError(error);
      }
    }
  }

  input.addEventListener('input', () => {
    syncEditor();
    inspect();
  });
  input.addEventListener('scroll', syncEditor);
  actionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button instanceof HTMLButtonElement && button.dataset.jsonAction) runAction(button.dataset.jsonAction);
    });
  });
  tabs.forEach((tab, index) => {
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.addEventListener('click', () => {
      if (tab instanceof HTMLButtonElement && !tab.disabled && tab.dataset.jsonTab) selectTab(tab.dataset.jsonTab);
    });
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      let next = index;
      do {
        next = (next + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      } while (tabs[next].disabled && next !== index);
      tabs[next].focus();
      if (tabs[next].dataset.jsonTab) selectTab(tabs[next].dataset.jsonTab);
    });
  });
  treeSearch.addEventListener('input', () => {
    const query = treeSearch.value.trim().toLowerCase();
    const rows = [...tree.querySelectorAll('.json-tree-select')];
    rows.forEach((row) => {
      const node = row.closest('.json-tree-node');
      if (node instanceof HTMLElement) node.hidden = Boolean(query) && !row.dataset.search.includes(query);
    });
    if (query) {
      rows.filter((row) => row.dataset.search.includes(query)).forEach((row) => {
        let node = row.closest('.json-tree-node');
        while (node instanceof HTMLElement) {
          node.hidden = false;
          const nested = node.querySelector(':scope > .json-tree-list');
          if (nested instanceof HTMLElement) nested.hidden = false;
          node = node.parentElement.closest('.json-tree-node');
        }
      });
    }
  });
  treeExpandButton.addEventListener('click', () => {
    tree.querySelectorAll('.json-tree-node > .json-tree-list').forEach((list) => { list.hidden = false; });
    tree.querySelectorAll('.json-tree-toggle:not(:disabled)').forEach((button) => {
      button.textContent = '▾';
      button.setAttribute('aria-expanded', 'true');
    });
  });
  treeCollapseButton.addEventListener('click', () => {
    tree.querySelectorAll('.json-tree-node > .json-tree-list').forEach((list) => { list.hidden = true; });
    tree.querySelectorAll('.json-tree-toggle:not(:disabled)').forEach((button) => {
      button.textContent = '▸';
      button.setAttribute('aria-expanded', 'false');
    });
  });
  bench.querySelector('[data-json-apply-repair]')?.addEventListener('click', () => {
    if (!repair) return;
    input.value = repair.candidate;
    syncEditor();
    inspect();
    if (!valid) {
      status('The proposed repair did not pass validation; check the input before continuing.', 'error');
      return;
    }
    try {
      const indentation = indentSelect.value === 'tab' ? '\t' : Number(indentSelect.value);
      setOutput(JSON.stringify(parsed, null, indentation), 'json', 'Repair applied and validated');
      selectTab('output');
    } catch (error) {
      actionError(error);
    }
  });
  copyPathButton.addEventListener('click', () => {
    if (hasSelectedValue) copyText(selectedPath, 'JSON path copied.');
  });
  copyValueButton.addEventListener('click', () => {
    if (!hasSelectedValue) return;
    try {
      const indentation = indentSelect.value === 'tab' ? '\t' : Number(indentSelect.value);
      copyText(JSON.stringify(selectedValue, null, indentation), 'Selected JSON value copied.');
    } catch (error) {
      actionError(error);
    }
  });

  input.value = sample;
  syncEditor();
  inspect();
  status('Sample loaded. Review the safe trailing-comma proposal.', 'info');
})();
