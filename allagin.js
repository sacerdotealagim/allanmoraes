// menu hamburger
const menuBtn = document.getElementById('menu-btn');
const navbar = document.querySelector('.navbar');

menuBtn.addEventListener('click', () => {
    navbar.classList.toggle('active');
});


 // Seleciona todos os cards da seção de serviços
  const servicos = document.querySelectorAll('.servico');

  // Cria um observador que detecta quando os elementos entram na tela
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { // se o elemento estiver visível
        entry.target.classList.add('visible'); // adiciona a classe que ativa a animação
        observer.unobserve(entry.target); // para não repetir a animação
      }
    });
  }, {
    threshold: 0.2 // ativa quando 20% do elemento estiver visível
  });

  // Aplica o observador em cada card
  servicos.forEach(servico => {
    observer.observe(servico);
  });

  // Seleciona todos os cards da seção de serviços
  const servicos1 = document.querySelectorAll('.servico1');

  // Cria um observador que detecta quando os elementos entram na tela
  const observer1 = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { // se o elemento estiver visível
        entry.target.classList.add('visible'); // adiciona a classe que ativa a animação
        observer1.unobserve(entry.target); // para não repetir a animação
      }
    });
  }, {
    threshold: 0.2 // ativa quando 20% do elemento estiver visível
  });

  // Aplica o observador em cada card
  servicos1.forEach(servico1 => {
    observer1.observe(servico1);
  });

  
  