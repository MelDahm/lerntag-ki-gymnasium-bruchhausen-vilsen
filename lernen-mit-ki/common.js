document.addEventListener("DOMContentLoaded", function () {
    // Prompt-Vorlagen je Erkundung
    const PROMPT_TEMPLATES = {
        socratic: (aspects) => `Wir sind eine Kleingruppe am Gymnasium Bruchhausen-Vilsen und erkunden gemeinsam, was generative KI für unser Lernen bedeutet. Uns beschäftigen dabei die folgenden Aspekte: ${aspects}. Beginne einen sokratischen Dialog mit uns dazu. Stelle uns eine erste kluge, vertiefende Frage, die wir gemeinsam in der Kleingruppe reflektieren können. Warte dann auf unsere Antwort. Erst danach stellst du die nächste Frage – offen, nachdenklich, anregend. Gib keine Antworten, sondern unterstütze uns dabei, durch deine Fragen eigene Einsichten zu entwickeln und basierend auf den geteilten Aspekten unser Lernen mit KI weiterzudenken. Wiederhole diesen Prozess, bis wir den Dialog beenden. Das Ziel ist, dass wir unser Erkenntnisinteresse prägnant auf den Punkt bringen können.`,

        brainstorm: (frage) => `Wir spielen ein kreatives Ideen-PingPong, um uns der Herausforderung zu stellen, in der KI-Debatte in der Schule vom Lernen auszugehen statt vom Lehren. Dazu gehören also aktive Lernende und selbstbestimmte Lernprozesse. Wir spielen als Kleingruppe. Du spielst allein und immer im Wechsel mit uns. Unsere konkrete Frage, zu der wir im genannten Kontext Ideen suchen, lautet: ${frage}.
Du beginnst, indem du uns bittest, eine erste Idee zu nennen, die wir uns als Kleingruppe überlegen – und dann die gefundene Idee mit dir teilen. Erst danach nennst du selbst eine Idee.
Dann forderst du uns direkt zur nächsten Idee auf – und so weiter.
Die Ideen sollen möglichst kurz, überraschend und unterschiedlich sein.
Wiederhole den Wechsel so lange, bis wir aufhören zu spielen.`,

        thesis: (these) => `Wir haben als Kleingruppe diese These zur Nutzung von KI im schulischen Kontext entwickelt: ${these}. Wir möchten dich nun bitten, uns bei der Weiterentwicklung dieser These zu unterstützen: Bitte gehe dazu schrittweise vor:

1. Nenne drei Argumente, die die These stützen könnten. Dann frage uns, ob wir weitere Argumente wollen oder du weitermachen kannst.
2. Nenne drei Gegenargumente oder Einschränkungen. Dann frage uns, ob wir weitere Gegenargumente wollen oder ob du weitermachen kannst.
3. Gib je ein Fallbeispiel: eines, das die These bestätigt, und eines, das sie widerlegt. Dann frage uns, ob wir noch andere Fallbeispiele wünschen oder ob du zum Abschluss kommen kannst.

Am Ende frage uns, wie wir auf Basis der Darstellung von dir die These modifizieren würden. Wenn wir dazu etwas geschrieben haben, machst du einen Vorschlag, wie du die These modifizieren würdest.

Nutze eine klare, prägnante und strukturierte Sprache.`
    };

    const FALLBACKS = {
        socratic: '[keine Aspekte eingegeben]',
        brainstorm: '[keine Frage eingegeben]',
        thesis: '[keine These eingegeben]'
    };

    function getUrlParam(name) {
        try {
            const url = new URL(window.location.href);
            return url.searchParams.get(name);
        } catch (e) {
            return null;
        }
    }

    // Formularverarbeitung (speichert die Eingabe in localStorage)
    const form = document.getElementById('challengeForm');
    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const inputEl = document.getElementById('challenge');
            const key = form.getAttribute('data-key') || 'challenge';
            const challenge = inputEl ? inputEl.value : '';
            try {
                localStorage.setItem(key, challenge);
                localStorage.setItem('challenge', challenge);
                localStorage.setItem('challenge-' + key, challenge);
                localStorage.setItem('aspekte', challenge);
                localStorage.setItem('frage', challenge);
                localStorage.setItem('these', challenge);
            } catch (e) {
                // Ignorieren, falls localStorage nicht verfügbar ist
            }

            const target = form.getAttribute('data-target');
            if (target) {
                window.location.href = target;
            }
        });
    }

    // Prompt aus der Eingabe erzeugen
    const resultText = document.getElementById('resultText');
    if (resultText) {
        const type = resultText.getAttribute('data-template') || 'socratic';
        const preferredKey = resultText.getAttribute('data-key');
        const keysToTry = [];
        if (preferredKey) keysToTry.push(preferredKey);
        keysToTry.push('challenge-' + type);
        keysToTry.push('challenge-' + (preferredKey || ''));
        keysToTry.push('aspekte', 'frage', 'these');
        keysToTry.push('challenge');
        let value = null;
        try {
            for (let i = 0; i < keysToTry.length; i++) {
                const k = keysToTry[i];
                if (!k || k === 'challenge-') continue;
                const v = localStorage.getItem(k);
                if (v && typeof v === 'string' && v.trim() !== '') {
                    value = v;
                    break;
                }
                if (v) {
                    value = v;
                    break;
                }
            }
        } catch (e) {
            // Ignorieren
        }
        // Auch URL-Parameter probieren
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
            const urlVals = [getUrlParam('challenge'), getUrlParam('aspekte'), getUrlParam('frage'), getUrlParam('these'), getUrlParam('input')];
            for (let i = 0; i < urlVals.length; i++) {
                if (urlVals[i] && urlVals[i].trim() !== '') {
                    value = decodeURIComponent(urlVals[i].replace(/\+/g, ' '));
                    break;
                }
            }
        }
        if (value === null || value === undefined) {
            value = FALLBACKS[type] || '[keine Eingabe]';
        }
        const template = PROMPT_TEMPLATES[type] || PROMPT_TEMPLATES.socratic;

        resultText.textContent = template(value);
    }

    // Copy-to-clipboard Funktion
    const copyButton = document.getElementById('copyButton');
    if (copyButton) {
        copyButton.addEventListener('click', function () {
            const textEl = document.getElementById('resultText');
            const textToCopy = textEl ? (textEl.innerText || textEl.textContent) : '';
            if (!textToCopy) return;
            try {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    copyButton.textContent = 'Prompt wurde kopiert!';
                    window.setTimeout(function () {
                        copyButton.textContent = 'Text kopieren';
                    }, 2500);
                }).catch(err => {
                    console.error('Kopieren fehlgeschlagen: ', err);
                });
            } catch (e) {
                console.error('Kopieren fehlgeschlagen: ', e);
            }
        });
    }
});
