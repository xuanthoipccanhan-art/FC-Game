/*
 * 12 CLB lớn châu Âu (tham dự Cúp C1 và thị trường chuyển nhượng).
 * Định dạng cầu thủ giống clubs-eng.js.
 */
(function () {
  const FC = (window.FC = window.FC || {});
  FC.DATA = FC.DATA || {};
  FC.DATA.EUR = [
    {
      id: "rma", name: "Real Madrid", short: "RMA", country: "ESP", city: "Madrid", founded: 1902, stadium: "Santiago Bernabéu", cap: 83186,
      colors: ["#FFFFFF", "#FEBE10", "#00529F"], crest: "round", rep: 97, money: 220, formation: "4-3-3",
      players: [
        ["Thibaut Courtois", "GK", 33, 89, "BEL"], ["Andriy Lunin", "GK", 26, 80, "UKR"],
        ["Antonio Rüdiger", "CB", 32, 86, "GER"], ["Éder Militão", "CB", 27, 84, "BRA"], ["Dean Huijsen", "CB", 20, 81, "ESP", 89],
        ["Raúl Asencio", "CB", 22, 76, "ESP", 82], ["David Alaba", "CB", 33, 79, "AUT"], ["Álvaro Carreras", "LB", 22, 80, "ESP", 85],
        ["Ferland Mendy", "LB", 30, 80, "FRA"], ["Trent Alexander-Arnold", "RB", 27, 86, "ENG"], ["Dani Carvajal", "RB", 33, 84, "ESP"],
        ["Aurélien Tchouaméni", "CDM", 25, 85, "FRA", 87], ["Federico Valverde", "CM", 27, 88, "URU"], ["Eduardo Camavinga", "CM", 22, 84, "FRA", 88],
        ["Dani Ceballos", "CM", 29, 79, "ESP"], ["Jude Bellingham", "CAM", 22, 89, "ENG", 93], ["Arda Güler", "CAM", 20, 82, "TUR", 90],
        ["Brahim Díaz", "CAM", 26, 80, "MAR"], ["Vinícius Júnior", "LW", 25, 90, "BRA"], ["Rodrygo", "RW", 24, 85, "BRA"],
        ["Franco Mastantuono", "RW", 18, 77, "ARG", 90], ["Kylian Mbappé", "ST", 26, 91, "FRA", 93], ["Gonzalo García", "ST", 21, 74, "ESP", 82],
      ],
    },
    {
      id: "fcb", name: "FC Barcelona", short: "BAR", country: "ESP", city: "Barcelona", founded: 1899, stadium: "Spotify Camp Nou", cap: 62000,
      colors: ["#A50044", "#004D98", "#EDBB00"], crest: "stripes", rep: 94, money: 90, formation: "4-2-3-1",
      players: [
        ["Joan García", "GK", 24, 82, "ESP", 87], ["Marc-André ter Stegen", "GK", 33, 85, "GER"], ["Wojciech Szczęsny", "GK", 35, 80, "POL"],
        ["Pau Cubarsí", "CB", 18, 82, "ESP", 91], ["Ronald Araújo", "CB", 26, 83, "URU"], ["Eric García", "CB", 24, 79, "ESP"],
        ["Andreas Christensen", "CB", 29, 79, "DEN"], ["Alejandro Balde", "LB", 21, 82, "ESP", 87], ["Gerard Martín", "LB", 23, 74, "ESP"],
        ["Jules Koundé", "RB", 26, 85, "FRA"], ["Marc Casadó", "CDM", 22, 77, "ESP", 83], ["Marc Bernal", "CDM", 18, 73, "ESP", 86],
        ["Pedri", "CM", 22, 89, "ESP", 92], ["Frenkie de Jong", "CM", 28, 86, "NED"], ["Gavi", "CM", 21, 82, "ESP", 88],
        ["Dani Olmo", "CAM", 27, 84, "ESP"], ["Fermín López", "CAM", 22, 80, "ESP", 85], ["Raphinha", "LW", 28, 89, "BRA"],
        ["Marcus Rashford", "LW", 27, 81, "ENG"], ["Lamine Yamal", "RW", 18, 90, "ESP", 96], ["Robert Lewandowski", "ST", 37, 85, "POL"],
        ["Ferran Torres", "ST", 25, 80, "ESP"],
      ],
    },
    {
      id: "atm", name: "Atlético de Madrid", short: "ATM", country: "ESP", city: "Madrid", founded: 1903, stadium: "Metropolitano", cap: 70460,
      colors: ["#CB3524", "#FFFFFF", "#272E61"], crest: "shield", rep: 87, money: 80, formation: "4-4-2",
      players: [
        ["Jan Oblak", "GK", 32, 87, "SVN"], ["Juan Musso", "GK", 31, 76, "ARG"],
        ["José María Giménez", "CB", 30, 82, "URU"], ["Robin Le Normand", "CB", 28, 81, "ESP"], ["Dávid Hancko", "CB", 27, 81, "SVK"],
        ["Clément Lenglet", "CB", 30, 77, "FRA"], ["Matteo Ruggeri", "LB", 23, 77, "ITA"], ["Marcos Llorente", "RB", 30, 82, "ESP"],
        ["Nahuel Molina", "RB", 27, 79, "ARG"], ["Marc Pubill", "RB", 22, 74, "ESP"], ["Koke", "CM", 33, 81, "ESP"],
        ["Pablo Barrios", "CM", 22, 80, "ESP", 86], ["Conor Gallagher", "CM", 25, 81, "ENG"], ["Johnny Cardoso", "CDM", 23, 77, "USA", 82],
        ["Álex Baena", "LM", 24, 83, "ESP", 86], ["Thiago Almada", "CAM", 24, 79, "ARG"], ["Nico González", "LM", 27, 79, "ARG"],
        ["Giuliano Simeone", "RM", 22, 77, "ARG", 82], ["Julián Álvarez", "ST", 25, 87, "ARG", 89], ["Antoine Griezmann", "ST", 34, 84, "FRA"],
        ["Alexander Sørloth", "ST", 29, 82, "NOR"], ["Giacomo Raspadori", "ST", 25, 78, "ITA"],
      ],
    },
    {
      id: "fcbay", name: "Bayern München", short: "FCB", country: "GER", city: "München", founded: 1900, stadium: "Allianz Arena", cap: 75024,
      colors: ["#DC052D", "#FFFFFF", "#0066B2"], crest: "round", rep: 94, money: 150, formation: "4-2-3-1",
      players: [
        ["Manuel Neuer", "GK", 39, 85, "GER"], ["Jonas Urbig", "GK", 22, 75, "GER", 83],
        ["Dayot Upamecano", "CB", 26, 84, "FRA"], ["Jonathan Tah", "CB", 29, 85, "GER"], ["Kim Min-jae", "CB", 28, 83, "KOR"],
        ["Hiroki Ito", "CB", 26, 79, "JPN"], ["Alphonso Davies", "LB", 24, 83, "CAN"], ["Josip Stanišić", "RB", 25, 78, "CRO"],
        ["Konrad Laimer", "RB", 28, 80, "AUT"], ["Joshua Kimmich", "CDM", 30, 88, "GER"], ["Aleksandar Pavlović", "CDM", 21, 81, "GER", 88],
        ["Leon Goretzka", "CM", 30, 81, "GER"], ["Tom Bischof", "CM", 20, 74, "GER", 84], ["Jamal Musiala", "CAM", 22, 89, "GER", 92],
        ["Michael Olise", "RW", 23, 87, "FRA", 90], ["Serge Gnabry", "RW", 30, 80, "GER"], ["Lennart Karl", "RW", 17, 70, "GER", 88],
        ["Luis Díaz", "LW", 28, 85, "COL"], ["Harry Kane", "ST", 32, 90, "ENG"], ["Nicolas Jackson", "ST", 24, 79, "SEN"],
      ],
    },
    {
      id: "bvb", name: "Borussia Dortmund", short: "BVB", country: "GER", city: "Dortmund", founded: 1909, stadium: "Signal Iduna Park", cap: 81365,
      colors: ["#FDE100", "#000000", "#000000"], crest: "round", rep: 85, money: 70, formation: "3-4-3",
      players: [
        ["Gregor Kobel", "GK", 27, 86, "SUI"], ["Alexander Meyer", "GK", 34, 70, "GER"],
        ["Nico Schlotterbeck", "CB", 25, 83, "GER"], ["Waldemar Anton", "CB", 29, 79, "GER"], ["Niklas Süle", "CB", 30, 78, "GER"],
        ["Ramy Bensebaini", "LB", 30, 77, "ALG"], ["Daniel Svensson", "LB", 23, 75, "SWE"], ["Julian Ryerson", "RB", 27, 78, "NOR"],
        ["Yan Couto", "RB", 23, 77, "BRA"], ["Emre Can", "CDM", 31, 79, "GER"], ["Marcel Sabitzer", "CM", 31, 80, "AUT"],
        ["Felix Nmecha", "CM", 24, 79, "GER", 83], ["Pascal Groß", "CM", 34, 79, "GER"], ["Jobe Bellingham", "CM", 20, 74, "ENG", 86],
        ["Julian Brandt", "CAM", 29, 81, "GER"], ["Carney Chukwuemeka", "CAM", 21, 73, "AUT"], ["Karim Adeyemi", "LW", 23, 79, "GER"],
        ["Maximilian Beier", "ST", 22, 79, "GER", 84], ["Serhou Guirassy", "ST", 29, 85, "GUI"], ["Fábio Silva", "ST", 23, 75, "POR"],
      ],
    },
    {
      id: "b04", name: "Bayer 04 Leverkusen", short: "B04", country: "GER", city: "Leverkusen", founded: 1904, stadium: "BayArena", cap: 30210,
      colors: ["#E32221", "#000000", "#F1E800"], crest: "round", rep: 83, money: 80, formation: "3-4-3",
      players: [
        ["Mark Flekken", "GK", 32, 80, "NED"], ["Janis Blaswich", "GK", 34, 74, "GER"],
        ["Edmond Tapsoba", "CB", 26, 81, "BFA"], ["Loïc Badé", "CB", 25, 78, "FRA"], ["Jarell Quansah", "CB", 22, 77, "ENG", 83],
        ["Alejandro Grimaldo", "LB", 30, 84, "ESP"], ["Lucas Vázquez", "RB", 34, 77, "ESP"], ["Arthur", "RB", 22, 72, "BRA"],
        ["Robert Andrich", "CDM", 31, 79, "GER"], ["Exequiel Palacios", "CM", 27, 81, "ARG"], ["Aleix García", "CM", 28, 79, "ESP"],
        ["Malik Tillman", "CAM", 23, 78, "USA", 83], ["Ibrahim Maza", "CAM", 19, 73, "ALG", 86], ["Eliesse Ben Seghir", "CAM", 20, 76, "MAR", 85],
        ["Martin Terrier", "LW", 28, 78, "FRA"], ["Ernest Poku", "RW", 21, 74, "NED", 82], ["Patrik Schick", "ST", 29, 81, "CZE"],
        ["Christian Kofane", "ST", 19, 70, "CMR", 84],
      ],
    },
    {
      id: "psg", name: "Paris Saint-Germain", short: "PSG", country: "FRA", city: "Paris", founded: 1970, stadium: "Parc des Princes", cap: 47929,
      colors: ["#004170", "#DA291C", "#FFFFFF"], crest: "round", rep: 94, money: 180, formation: "4-3-3",
      players: [
        ["Lucas Chevalier", "GK", 24, 82, "FRA", 87], ["Matvey Safonov", "GK", 26, 78, "RUS"],
        ["Marquinhos", "CB", 31, 86, "BRA"], ["Willian Pacho", "CB", 23, 84, "ECU", 87], ["Illia Zabarnyi", "CB", 22, 80, "UKR", 85],
        ["Lucas Beraldo", "CB", 21, 77, "BRA", 83], ["Nuno Mendes", "LB", 23, 87, "POR", 90], ["Lucas Hernández", "LB", 29, 79, "FRA"],
        ["Achraf Hakimi", "RB", 26, 88, "MAR"], ["Vitinha", "CM", 25, 89, "POR", 90], ["João Neves", "CM", 20, 86, "POR", 91],
        ["Fabián Ruiz", "CM", 29, 84, "ESP"], ["Warren Zaïre-Emery", "CM", 19, 80, "FRA", 88], ["Senny Mayulu", "CM", 19, 72, "FRA", 84],
        ["Lee Kang-in", "CAM", 24, 79, "KOR"], ["Khvicha Kvaratskhelia", "LW", 24, 88, "GEO", 90], ["Bradley Barcola", "LW", 23, 83, "FRA", 87],
        ["Désiré Doué", "RW", 20, 85, "FRA", 91], ["Ousmane Dembélé", "ST", 28, 90, "FRA"], ["Gonçalo Ramos", "ST", 24, 80, "POR"],
      ],
    },
    {
      id: "int", name: "Inter", short: "INT", country: "ITA", city: "Milano", founded: 1908, stadium: "San Siro", cap: 75817,
      colors: ["#0068A8", "#000000", "#D4AF37"], crest: "round", rep: 89, money: 70, formation: "3-5-2",
      players: [
        ["Yann Sommer", "GK", 36, 84, "SUI"], ["Josep Martínez", "GK", 27, 77, "ESP"],
        ["Alessandro Bastoni", "CB", 26, 86, "ITA"], ["Manuel Akanji", "CB", 30, 83, "SUI"], ["Stefan de Vrij", "CB", 33, 80, "NED"],
        ["Francesco Acerbi", "CB", 37, 79, "ITA"], ["Yann Bisseck", "CB", 24, 79, "GER"], ["Federico Dimarco", "LB", 27, 85, "ITA"],
        ["Carlos Augusto", "LB", 26, 77, "BRA"], ["Denzel Dumfries", "RB", 29, 83, "NED"], ["Hakan Çalhanoğlu", "CDM", 31, 86, "TUR"],
        ["Nicolò Barella", "CM", 28, 87, "ITA"], ["Henrikh Mkhitaryan", "CM", 36, 80, "ARM"], ["Davide Frattesi", "CM", 26, 80, "ITA"],
        ["Piotr Zieliński", "CM", 31, 80, "POL"], ["Petar Sučić", "CM", 22, 76, "CRO", 83], ["Lautaro Martínez", "ST", 28, 88, "ARG"],
        ["Marcus Thuram", "ST", 28, 84, "FRA"], ["Ange-Yoan Bonny", "ST", 22, 75, "FRA", 81], ["Pio Esposito", "ST", 20, 72, "ITA", 85],
      ],
    },
    {
      id: "acm", name: "AC Milan", short: "MIL", country: "ITA", city: "Milano", founded: 1899, stadium: "San Siro", cap: 75817,
      colors: ["#FB090B", "#000000", "#FFFFFF"], crest: "stripes", rep: 86, money: 70, formation: "3-5-2",
      players: [
        ["Mike Maignan", "GK", 30, 87, "FRA"], ["Pietro Terracciano", "GK", 35, 71, "ITA"],
        ["Fikayo Tomori", "CB", 27, 80, "ENG"], ["Strahinja Pavlović", "CB", 24, 78, "SRB"], ["Matteo Gabbia", "CB", 25, 77, "ITA"],
        ["Koni De Winter", "CB", 23, 75, "BEL"], ["Pervis Estupiñán", "LB", 27, 78, "ECU"], ["Davide Bartesaghi", "LB", 19, 70, "ITA", 80],
        ["Alexis Saelemaekers", "RB", 26, 78, "BEL"], ["Youssouf Fofana", "CDM", 26, 80, "FRA"], ["Samuele Ricci", "CDM", 24, 78, "ITA"],
        ["Luka Modrić", "CM", 40, 83, "CRO"], ["Adrien Rabiot", "CM", 30, 82, "FRA"], ["Ruben Loftus-Cheek", "CM", 29, 78, "ENG"],
        ["Ardon Jashari", "CM", 23, 77, "SUI", 82], ["Christian Pulisic", "RW", 27, 84, "USA"], ["Rafael Leão", "LW", 26, 85, "POR"],
        ["Santiago Giménez", "ST", 24, 79, "MEX"], ["Christopher Nkunku", "ST", 27, 80, "FRA"],
      ],
    },
    {
      id: "juv", name: "Juventus", short: "JUV", country: "ITA", city: "Torino", founded: 1897, stadium: "Allianz Stadium", cap: 41507,
      colors: ["#FFFFFF", "#000000", "#C9A227"], crest: "stripes", rep: 87, money: 80, formation: "3-4-3",
      players: [
        ["Michele Di Gregorio", "GK", 28, 81, "ITA"], ["Mattia Perin", "GK", 33, 76, "ITA"],
        ["Gleison Bremer", "CB", 28, 84, "BRA"], ["Pierre Kalulu", "CB", 25, 79, "FRA"], ["Federico Gatti", "CB", 27, 78, "ITA"],
        ["Lloyd Kelly", "CB", 27, 76, "ENG"], ["Andrea Cambiaso", "LB", 25, 81, "ITA"], ["Juan Cabal", "LB", 24, 75, "COL"],
        ["João Mário", "RB", 25, 75, "POR"], ["Manuel Locatelli", "CDM", 27, 81, "ITA"], ["Khéphren Thuram", "CM", 24, 81, "FRA", 84],
        ["Teun Koopmeiners", "CM", 27, 81, "NED"], ["Weston McKennie", "CM", 27, 78, "USA"], ["Kenan Yıldız", "LW", 20, 83, "TUR", 89],
        ["Francisco Conceição", "RW", 22, 80, "POR", 85], ["Edon Zhegrova", "RW", 26, 79, "KOS"], ["Dušan Vlahović", "ST", 25, 82, "SRB"],
        ["Jonathan David", "ST", 25, 83, "CAN"], ["Loïs Openda", "ST", 25, 80, "BEL"],
      ],
    },
    {
      id: "nap", name: "Napoli", short: "NAP", country: "ITA", city: "Napoli", founded: 1926, stadium: "Diego Armando Maradona", cap: 54726,
      colors: ["#12A0D7", "#FFFFFF", "#003C82"], crest: "round", rep: 85, money: 75, formation: "4-3-3",
      players: [
        ["Alex Meret", "GK", 28, 81, "ITA"], ["Vanja Milinković-Savić", "GK", 28, 79, "SRB"],
        ["Alessandro Buongiorno", "CB", 26, 82, "ITA"], ["Amir Rrahmani", "CB", 31, 81, "KOS"], ["Sam Beukema", "CB", 27, 79, "NED"],
        ["Juan Jesus", "CB", 34, 72, "BRA"], ["Mathías Olivera", "LB", 28, 78, "URU"], ["Leonardo Spinazzola", "LB", 32, 76, "ITA"],
        ["Giovanni Di Lorenzo", "RB", 32, 83, "ITA"], ["Stanislav Lobotka", "CDM", 30, 84, "SVK"], ["Scott McTominay", "CM", 28, 86, "SCO"],
        ["Frank Anguissa", "CM", 29, 83, "CMR"], ["Billy Gilmour", "CM", 24, 78, "SCO"], ["Kevin De Bruyne", "CAM", 34, 87, "BEL"],
        ["Noa Lang", "LW", 26, 79, "NED"], ["Matteo Politano", "RW", 32, 79, "ITA"], ["David Neres", "RW", 28, 79, "BRA"],
        ["Rasmus Højlund", "ST", 22, 80, "DEN", 86], ["Romelu Lukaku", "ST", 32, 81, "BEL"], ["Lorenzo Lucca", "ST", 25, 76, "ITA"],
      ],
    },
    {
      id: "scp", name: "Sporting CP", short: "SCP", country: "POR", city: "Lisboa", founded: 1906, stadium: "José Alvalade", cap: 50095,
      colors: ["#008057", "#FFFFFF", "#FFD700"], crest: "stripes", rep: 80, money: 45, formation: "3-4-3",
      players: [
        ["Rui Silva", "GK", 31, 80, "POR"], ["Vladan Kovačević", "GK", 27, 74, "BIH"],
        ["Gonçalo Inácio", "CB", 24, 82, "POR", 85], ["Ousmane Diomande", "CB", 21, 80, "CIV", 86], ["Zeno Debast", "CB", 22, 77, "BEL", 83],
        ["Eduardo Quaresma", "CB", 23, 76, "POR"], ["Maximiliano Araújo", "LB", 25, 78, "URU"], ["Iván Fresneda", "RB", 21, 74, "ESP", 80],
        ["Morten Hjulmand", "CDM", 26, 82, "DEN"], ["Hidemasa Morita", "CM", 30, 78, "JPN"], ["Daniel Bragança", "CM", 26, 76, "POR"],
        ["João Simões", "CM", 18, 72, "POR", 84], ["Giorgi Kochorashvili", "CM", 26, 75, "GEO"], ["Pedro Gonçalves", "CAM", 27, 81, "POR"],
        ["Francisco Trincão", "RW", 25, 82, "POR"], ["Geovany Quenda", "RW", 18, 76, "POR", 88], ["Geny Catamo", "RW", 24, 76, "MOZ"],
        ["Luis Suárez", "ST", 28, 80, "COL"], ["Fotis Ioannidis", "ST", 25, 78, "GRE"],
      ],
    },
  ];
})();
