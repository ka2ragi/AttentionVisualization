// ATTENTION VISUALIZATION

const url = 'data/results.json';
const initial = document.getElementById('initial');
const emotionImage = document.getElementById('emotion');
const predDisplay = document.getElementById('pred');
const probDisplay = document.getElementById('prob');
const labelDisplay = document.getElementById('true-label');
const originalContainer = document.getElementById('original-text');
const visualizedContainer = document.getElementById('visualized');

const numberInput = document.getElementById('number-input');9
numberInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (numberInput.value !== null && numberInput.value !== '') {
      if (initial) {
        initial.remove();
      } else {
        console.error('指定されたコンテナは存在しません');
      }

      // clean up container
      originalContainer.innerHTML = '';
      visualizedContainer.innerHTML = '';

      const idxToShow = parseInt(numberInput.value, 10);
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error('ネットワーク応答が正常ではありません');
          }
          return response.json();
        })
        .then(jsonData => {
          const dataAtIndex = jsonData[idxToShow];

          // emotion image
          const imgSrc = dataAtIndex['pred'] === 0 ? 'svg/negative.svg' : 'svg/positive.svg';
          emotionImage.src = imgSrc;

          // pred
          const pred = dataAtIndex['pred'] === 0 ? 'Negative' : 'Positive';
          predDisplay.textContent = pred;

          // prob
          const prob = dataAtIndex['pred'] === 0 ? dataAtIndex['prob'].toFixed(5) : dataAtIndex['prob'].toFixed(5);
          probDisplay.textContent = prob; 

          // true label
          const label = dataAtIndex['label'] === 0 ? 'Negative' : 'Positive';
          labelDisplay.textContent = label;

          // original text
          const tokens = dataAtIndex['text'];
          tokens.forEach((token, index) => {
            const span = document.createElement('span');
            span.textContent = token + ' ';
            span.id = `text-${numberInput.value}-original-token-${index}`;
            originalContainer.appendChild(span);
          });

          // visualized text
          const attenScore = dataAtIndex['attention'];
          let imps = calculatePercentiles(attenScore);
          tokens.forEach((token, index) => {
            const span = document.createElement('span');
            const score = attenScore[index];
            const imp = imps[index];
            const colorIntensity = Math.min(255, Math.floor(score * 255));
            span.style.backgroundColor = `rgba(255, 0, 0, ${colorIntensity / 255})`;
            span.textContent = token + ' ';
            span.id = `text-${numberInput.value}-visualized-token-${index}`;
            span.setAttribute('data-score', score);
            span.setAttribute('data-imp', imp);
            visualizedContainer.appendChild(span);
          });

          // show details and highlight corresponding token
          const spans = document.querySelectorAll('#visualized span');
          const tooltip = document.createElement('div');
          tooltip.className = 'tooltip';
          document.body.appendChild(tooltip);

          spans.forEach(span => {
            span.addEventListener('mouseenter', (e) => {
              const token = span.textContent;
              const score = span.getAttribute('data-score');
              const imp = span.getAttribute('data-imp');
              let impIndicator;
              const id = span.id.replace('visualized', 'original');

              // initialize
              const colorImpElement = document.querySelector('.color-imp');
              if (colorImpElement) {
                if (colorImpElement.classList.contains('low')) {
                  colorImpElement.classList.remove('low');
                }
                if (colorImpElement.classList.contains('medium')) {
                  colorImpElement.classList.remove('medium');
                }
                if (colorImpElement.classList.contains('high')) {
                  colorImpElement.classList.remove('high');
                }
              }

              tooltip.innerHTML = `<p class="token">token: ${token}</p><p class="score">score: ${score}</p><p class="imp">imp: <span class="color-imp">${imp}</span></p>`;
              tooltip.style.display = 'inline-block';
              tooltip.style.left = `${e.pageX + 10}px`;
              tooltip.style.top = `${e.pageY + 10}px`;
              console.log(document.querySelector('.color-imp'));
              if (imp === 'Low') {
                impIndicator = 'low';
              } else if (imp === 'Medium') {
                impIndicator = 'medium';
              } else {
                impIndicator = 'high';
              }
              document.querySelector('.color-imp').classList.add(impIndicator);
              document.getElementById(id).classList.add('original-highlight');
              console.log(imp);
            });

            span.addEventListener('mouseleave', () => {
              const id = span.id.replace('visualized', 'original');
              tooltip.style.display = 'none';
              document.getElementById(id).classList.remove('original-highlight');
            });

            span.addEventListener('mousemove', (e) => {
              tooltip.style.left = `${e.pageX + 10}px`;
              tooltip.style.top = `${e.pageY + 10}px`;
            });
          });
        })
        .catch(error => {
          console.error('データ取得中にエラーが発生しました:', error);
      });
    } 
  }
});


// function for calculating importance
const calculatePercentiles = (attention) => {

  // sort
  let sorted = [...attention].sort((a, b) => a - b);

  // calculate 33% and 66% point index
  let p33Index = Math.floor(sorted.length * 0.33);
  let p66Index = Math.floor(sorted.length * 0.66);

  // calculate 33% and 66% point value
  let p33Value = sorted[p33Index];
  let p66value = sorted[p66Index];

  return attention.map(value => {
    if (value <= p33Value) {
      return 'Low';
    } else if (value <= p66value) {
      return 'Medium';
    } else {
      return 'High';
    }
  });
} 




