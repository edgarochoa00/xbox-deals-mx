const fs = require('fs');
const path = require('path');

// Raw game data extracted from Xbox MX store deals page
// Format: { title, originalPrice, salePrice, discount, image }
const rawGames = [
  { title: "RoboCop: Rogue City - Unfinished Business", originalPrice: 529, salePrice: 529, discount: "-0%" },
  { title: "Dispatch", originalPrice: 339, salePrice: 305.1, discount: "-10%" },
  { title: "Grand Theft Auto V (Xbox One y Xbox Series X|S)", originalPrice: 799, salePrice: 399.5, discount: "-50%" },
  { title: "Edición Estándar WWE 2K26", originalPrice: 1299, salePrice: 649.5, discount: "-50%" },
  { title: "Golf With Your Friends - Ultimate Edition", originalPrice: 949, salePrice: 94.9, discount: "-90%" },
  { title: "7 Days to Die - Console Edition (Game Preview)", originalPrice: 799, salePrice: 439.45, discount: "-45%" },
  { title: "Dispatch - Edición Digital Deluxe", originalPrice: 409, salePrice: 368.1, discount: "-10%" },
  { title: "Waterpark Simulator", originalPrice: 147, salePrice: 117.6, discount: "-20%" },
  { title: "LEGO® Batman™: El Legado del Caballero de la Noche", originalPrice: 1199, salePrice: 959.2, discount: "-20%" },
  { title: "The Elder Scrolls V: Skyrim Special Edition", originalPrice: 799, salePrice: 199.75, discount: "-75%" },
  { title: "Grand Theft Auto V Enhanced (PC)", originalPrice: 599, salePrice: 299.5, discount: "-50%" },
  { title: "Fallout 3", originalPrice: 199, salePrice: 49.75, discount: "-75%" },
  { title: "Mistfall Hunter", originalPrice: 439, salePrice: 395.1, discount: "-10%" },
  { title: "Fallout: New Vegas", originalPrice: 199, salePrice: 99.5, discount: "-50%" },
  { title: "DOOM", originalPrice: 399, salePrice: 79.8, discount: "-80%" },
  { title: "LEGO® Harry Potter™ Colección", originalPrice: 249, salePrice: 49.8, discount: "-80%" },
  { title: "DOOM: The Dark Ages Premium Edition", originalPrice: 1999, salePrice: 659.67, discount: "-67%" },
  { title: "Baldur's Gate 3", originalPrice: 1239, salePrice: 867.3, discount: "-30%" },
  { title: "LEGO® Batman™: El Legado del Caballero de la Noche Edición Deluxe", originalPrice: 1499, salePrice: 1199.2, discount: "-20%" },
  { title: "FOR HONOR - Standard Edition", originalPrice: 599, salePrice: 89.85, discount: "-85%" },
  { title: "Edición Monday Night War de WWE 2K26", originalPrice: 2999, salePrice: 1799.4, discount: "-40%" },
  { title: "Wolfenstein: Alt History Collection", originalPrice: 1199, salePrice: 239.8, discount: "-80%" },
  { title: "Hogwarts Legacy", originalPrice: 1199, salePrice: 179.85, discount: "-85%" },
  { title: "Fallout 4", originalPrice: 399, salePrice: 159.6, discount: "-60%" },
  { title: "Red Dead Online", originalPrice: 399, salePrice: 199.5, discount: "-50%" },
  { title: "Fallout 76 (PC)", originalPrice: 799, salePrice: 199.75, discount: "-75%" },
  { title: "Gang Beasts", originalPrice: 229, salePrice: 91.6, discount: "-60%" },
  { title: "The Evil Within® 2", originalPrice: 799, salePrice: 159.8, discount: "-80%" },
  { title: "Mistfall Hunter - Edición deluxe", originalPrice: 709, salePrice: 638.1, discount: "-10%" },
  { title: "FOR HONOR – Ultimate Edition", originalPrice: 1799, salePrice: 269.85, discount: "-85%" },
  { title: "DOOM: The Dark Ages Premium Upgrade", originalPrice: 629, salePrice: 207.57, discount: "-67%" },
  { title: "Dishonored® Definitive Edition", originalPrice: 399, salePrice: 99.75, discount: "-75%" },
  { title: "Bellwright", originalPrice: 529, salePrice: 343.85, discount: "-35%" },
  { title: "DOOM: The Dark Ages", originalPrice: 1399, salePrice: 461.67, discount: "-67%" },
  { title: "Prey®: Digital Deluxe Edition", originalPrice: 799, salePrice: 159.8, discount: "-80%" },
  { title: "Pure Pool Pro", originalPrice: 439, salePrice: 351.2, discount: "-20%" },
  { title: "Mafia III: Definitive Edition", originalPrice: 749.99, salePrice: 149.99, discount: "-80%" },
  { title: "MX vs ATV Legends", originalPrice: 709, salePrice: 177.25, discount: "-75%" },
  { title: "Wolfenstein® II: The New Colossus™ Digital Deluxe Edition", originalPrice: 1399, salePrice: 209.85, discount: "-85%" },
  { title: "The Evil Within", originalPrice: 389, salePrice: 97.25, discount: "-75%" },
  { title: "Gothic 1 Remake", originalPrice: 1059, salePrice: 847.2, discount: "-20%" },
  { title: "Versión de Hogwarts Legacy para Xbox One", originalPrice: 999, salePrice: 149.85, discount: "-85%" },
  { title: "Holdfast: Nations At War", originalPrice: 229, salePrice: 148.85, discount: "-35%" },
  { title: "Edición Deluxe de Borderlands®4", originalPrice: 1999, salePrice: 799.6, discount: "-60%" },
  { title: "The Quarry - Edición Deluxe", originalPrice: 1799, salePrice: 179.9, discount: "-90%" },
  { title: "Dishonored 2", originalPrice: 599, salePrice: 119.8, discount: "-80%" },
  { title: "Mafia II: Definitive Edition", originalPrice: 749.99, salePrice: 149.99, discount: "-80%" },
  { title: "The Elder Scrolls IV: Oblivion Remastered", originalPrice: 999, salePrice: 699.3, discount: "-30%" },
  { title: "Baldur's Gate 3 - Digital Deluxe Edition", originalPrice: 1409, salePrice: 986.3, discount: "-30%" },
  { title: "Mafia: The Old Country Edición Deluxe", originalPrice: 1199, salePrice: 719.4, discount: "-40%" },
  { title: "Overcooked! All You Can Eat", originalPrice: 494.99, salePrice: 148.49, discount: "-70%" },
  { title: "Fallout 76", originalPrice: 799, salePrice: 199.75, discount: "-75%" },
  { title: "DOOM 64", originalPrice: 89, salePrice: 35.6, discount: "-60%" },
  { title: "DOOM + DOOM II", originalPrice: 199, salePrice: 79.6, discount: "-60%" },
  { title: "Zombie Graveyard Simulator", originalPrice: 269, salePrice: 242.1, discount: "-10%" },
  { title: "RAGE", originalPrice: 199, salePrice: 79.6, discount: "-60%" },
  { title: "Starfield", originalPrice: 999, salePrice: 799.2, discount: "-20%" },
  { title: "Indiana Jones y el Gran Círculo", originalPrice: 1399, salePrice: 839.4, discount: "-40%" },
  { title: "Starfield Premium Edition Upgrade", originalPrice: 499, salePrice: 424.15, discount: "-15%" },
  { title: "Wolfenstein: The New Order", originalPrice: 385, salePrice: 96.25, discount: "-75%" },
  { title: "DOOM Eternal Deluxe Edition", originalPrice: 999, salePrice: 329.67, discount: "-67%" },
  { title: "Wolfenstein®: The Two-Pack", originalPrice: 705, salePrice: 176.25, discount: "-75%" },
  { title: "Drug Dealer Simulator 2", originalPrice: 439, salePrice: 373.15, discount: "-15%" },
  { title: "DOOM Eternal Standard Edition", originalPrice: 599, salePrice: 197.67, discount: "-67%" },
  { title: "Brotato & Abyssal Terrors DLC - Bundle", originalPrice: 141, salePrice: 105.75, discount: "-25%" },
  { title: "PowerWash Simulator 2", originalPrice: 339, salePrice: 254.25, discount: "-25%" },
  { title: "Fantasy Dash", originalPrice: 53, salePrice: 17, discount: "-68%" },
  { title: "DOOM 3", originalPrice: 199, salePrice: 79.6, discount: "-60%" },
  { title: "Quake II", originalPrice: 177, salePrice: 70.8, discount: "-60%" },
  { title: "Paquete de Red Dead Redemption y Red Dead Redemption 2", originalPrice: 1999, salePrice: 799.6, discount: "-60%" },
  { title: "The King is Watching", originalPrice: 177, salePrice: 159.3, discount: "-10%" },
  { title: "Fallout 4: Anniversary Edition", originalPrice: 1199, salePrice: 719.4, discount: "-40%" },
  { title: "MXGP 2020 - The Official Motocross Videogame", originalPrice: 549, salePrice: 54.9, discount: "-90%" },
  { title: "DOOM Anthology", originalPrice: 1599, salePrice: 559.65, discount: "-65%" },
  { title: "Paquete de expansión de DOOM Eternal: The Ancient Gods", originalPrice: 399, salePrice: 279.3, discount: "-30%" },
  { title: "Quake", originalPrice: 199, salePrice: 79.6, discount: "-60%" },
  { title: "LOLLIPOP CHAINSAW RePOP", originalPrice: 798.89, salePrice: 479.33, discount: "-40%" },
  { title: "Zoochosis", originalPrice: 279, salePrice: 125.55, discount: "-55%" },
  { title: "RAGE 2: Deluxe Edition", originalPrice: 1199, salePrice: 239.8, discount: "-80%" },
  { title: "THE KING OF FIGHTERS XV Ultimate Edition", originalPrice: 1199, salePrice: 299.75, discount: "-75%" },
  { title: "SAMURAI SHODOWN (Standard Ver.)", originalPrice: 1059, salePrice: 158.85, discount: "-85%" },
  { title: "FOR HONOR - Gold Edition", originalPrice: 1199, salePrice: 179.85, discount: "-85%" },
  { title: "7 Days to Die (Game Preview)", originalPrice: 789, salePrice: 433.95, discount: "-45%" },
  { title: "Disney Dreamlight Valley", originalPrice: 709, salePrice: 496.3, discount: "-30%" },
  { title: "Wolfenstein® II: The New Colossus™", originalPrice: 809, salePrice: 121.35, discount: "-85%" },
  { title: "The Elder Scrolls Online: Standard Edition", originalPrice: 399, salePrice: 99.75, discount: "-75%" },
  { title: "Wolfenstein: The Old Blood", originalPrice: 321, salePrice: 80.25, discount: "-75%" },
  { title: "RIDE 5", originalPrice: 899, salePrice: 179.8, discount: "-80%" },
  { title: "Heretic + Hexen", originalPrice: 299, salePrice: 200.33, discount: "-33%" },
  { title: "Borderlands: The Handsome Collection", originalPrice: 999.75, salePrice: 249.93, discount: "-75%" },
  { title: "Indiana Jones y el Gran Círculo™: Mejora Prémium Digital", originalPrice: 699, salePrice: 349.5, discount: "-50%" },
  { title: "MotoGP™25 - Xbox Series X|S", originalPrice: 899, salePrice: 179.8, discount: "-80%" },
  { title: "Don't Starve Together: Console Edition", originalPrice: 199, salePrice: 69.65, discount: "-65%" },
  { title: "MONSTER HUNTER: WORLD™", originalPrice: 515.03, salePrice: 206.01, discount: "-60%" },
  { title: "Celeste", originalPrice: 229, salePrice: 57.25, discount: "-75%" },
  { title: "Midway Arcade Origins", originalPrice: 299, salePrice: 75, discount: "-75%" },
  { title: "DEATHLOOP", originalPrice: 1199, salePrice: 239.8, discount: "-80%" },
  { title: "Minecraft Dungeons paquete de DLC definitivo", originalPrice: 349, salePrice: 174.5, discount: "-50%" },
  { title: "Deep Rock Galactic", originalPrice: 279, salePrice: 83.7, discount: "-70%" },
  { title: "Shard Squad", originalPrice: 123, salePrice: 110.7, discount: "-10%" },
  { title: "Wolfenstein: Youngblood Deluxe Edition", originalPrice: 599, salePrice: 119.8, discount: "-80%" },
  { title: "Disney Dreamlight Valley - Edición definitiva", originalPrice: 1409, salePrice: 1127.2, discount: "-20%" },
  { title: "Red Faction II", originalPrice: 249, salePrice: 39, discount: "-84%" },
  { title: "Harry Potter: Campeones de quidditch", originalPrice: 349, salePrice: 52.35, discount: "-85%" },
  { title: "Wolfenstein II: Deluxe Edition", originalPrice: 1399, salePrice: 209.85, discount: "-85%" },
  { title: "Dungeon Antiqua", originalPrice: 125, salePrice: 106.25, discount: "-15%" },
  { title: "Lightyear Frontier (Versión preliminar del juego)", originalPrice: 439, salePrice: 263.4, discount: "-40%" },
  { title: "Fallout: New Vegas Ultimate Edition", originalPrice: 399, salePrice: 159.6, discount: "-60%" },
  { title: "RIDE 5 - Special Edition", originalPrice: 1449, salePrice: 289.8, discount: "-80%" },
  { title: "A Game About Digging A Hole™", originalPrice: 89, salePrice: 62.3, discount: "-30%" },
  { title: "Golf With Your Friends - Ultimate Edition", originalPrice: 949, salePrice: 94.9, discount: "-90%" },
  { title: "Wolfenstein: Youngblood", originalPrice: 399, salePrice: 99.75, discount: "-75%" },
  { title: "Ghostwire: Tokyo", originalPrice: 1199, salePrice: 299.75, discount: "-75%" },
  { title: "Frog Sqwad", originalPrice: 99, salePrice: 74.25, discount: "-25%" },
  { title: "Red Faction: Armageddon", originalPrice: 499, salePrice: 75, discount: "-85%" },
  { title: "The Elder Scrolls V: Skyrim Special Edition (PC)", originalPrice: 719, salePrice: 179.75, discount: "-75%" },
  { title: "THE KING OF FIGHTERS XV Standard Edition", originalPrice: 499, salePrice: 124.75, discount: "-75%" },
  { title: "RAGE 2", originalPrice: 799, salePrice: 159.8, discount: "-80%" },
  { title: "SpongeBob SquarePants: Battle for Bikini Bottom - Rehydrated", originalPrice: 519, salePrice: 259.5, discount: "-50%" },
  { title: "Blast'N Bounty", originalPrice: 79, salePrice: 63.2, discount: "-20%" },
  { title: "Escape Dead Island", originalPrice: 299, salePrice: 45, discount: "-85%" },
  { title: "Gas Station Simulator and Can Touch This DLC Bundle (Xbox Series)", originalPrice: 419, salePrice: 335.2, discount: "-20%" },
  { title: "Case Solved: The London Files", originalPrice: 139, salePrice: 118.15, discount: "-15%" },
  { title: "MX vs ATV All Out", originalPrice: 399, salePrice: 79.8, discount: "-80%" },
  { title: "Redtail Relic Rush", originalPrice: 89, salePrice: 71.2, discount: "-20%" },
  { title: "Street Fighter™ 6 Years 1-2 Fighters Edition", originalPrice: 1240, salePrice: 806, discount: "-35%" },
  { title: "Operation: Tango", originalPrice: 404.83, salePrice: 101.2, discount: "-75%" },
  { title: "Broforce", originalPrice: 269, salePrice: 53.8, discount: "-80%" },
  { title: "Deep Rock Galactic - Ultimate Edition", originalPrice: 879, salePrice: 263.7, discount: "-70%" },
  { title: "MX vs. ATV: Untamed", originalPrice: 299, salePrice: 59.8, discount: "-80%" },
  { title: "Verho - Curse of Faces", originalPrice: 439, salePrice: 395.1, discount: "-10%" },
  { title: "Viewfinder", originalPrice: 299, salePrice: 104.65, discount: "-65%" },
  { title: "Edición maestra de Monster Hunter World: Iceborne", originalPrice: 1037.03, salePrice: 259.25, discount: "-75%" },
  { title: "Formula Legends", originalPrice: 199, salePrice: 119.4, discount: "-40%" },
  { title: "The Elder Scrolls V: Skyrim Anniversary Edition + Fallout 4: Anniversary Edition Bundle", originalPrice: 1799, salePrice: 1079.4, discount: "-40%" },
  { title: "Return to Castle Wolfenstein", originalPrice: 89, salePrice: 35.6, discount: "-60%" },
  { title: "Fallout 3: Game of the Year Edition", originalPrice: 399, salePrice: 131.67, discount: "-67%" },
  { title: "XCOM® 2", originalPrice: 399, salePrice: 59.85, discount: "-85%" },
  { title: "Solarpunk", originalPrice: 298.99, salePrice: 239.19, discount: "-20%" },
  { title: "Inscryption", originalPrice: 349, salePrice: 104.7, discount: "-70%" },
  { title: "Wake Up, Lia!", originalPrice: 79, salePrice: 63.2, discount: "-20%" },
  { title: "MotoGP™25 - Xbox One", originalPrice: 899, salePrice: 179.8, discount: "-80%" },
  { title: "Redfall", originalPrice: 799, salePrice: 399.5, discount: "-50%" },
  { title: "Townscaper", originalPrice: 89, salePrice: 35.6, discount: "-60%" },
  { title: "Don't Starve Mega Pack 2020", originalPrice: 569, salePrice: 256.05, discount: "-55%" },
  { title: "Sid Meier's Civilization® VII Edición Deluxe", originalPrice: 1699, salePrice: 849.5, discount: "-50%" },
  { title: "XCOM® 2 Digital Deluxe Edition", originalPrice: 599, salePrice: 149.75, discount: "-75%" },
  { title: "Fallout", originalPrice: 199, salePrice: 49.75, discount: "-75%" },
  { title: "Supermarket Simulator DLC Bundle", originalPrice: 259, salePrice: 207.2, discount: "-20%" },
  { title: "Monster Energy Supercross 4 - Special Edition", originalPrice: 899, salePrice: 89.9, discount: "-90%" },
  { title: "Sniper Elite: Resistance Deluxe Edition", originalPrice: 1589, salePrice: 794.5, discount: "-50%" },
  { title: "Wolfenstein: The New Order (PC)", originalPrice: 349, salePrice: 87.25, discount: "-75%" },
  { title: "Firefighting Simulator: Ignite - Year 1 Edition", originalPrice: 969, salePrice: 581.4, discount: "-40%" },
  { title: "Sid Meier's Civilization® VI Anthology", originalPrice: 1400, salePrice: 560, discount: "-60%" },
  { title: "Destroy All Humans!", originalPrice: 719, salePrice: 359.5, discount: "-50%" },
  { title: "Monster Energy Supercross - The Official Videogame 4", originalPrice: 549, salePrice: 54.9, discount: "-90%" },
  { title: "Bulletstorm: Full Clip Edition Duke Nukem Bundle", originalPrice: 671.63, salePrice: 134.32, discount: "-80%" },
  { title: "Railway Routes", originalPrice: 89, salePrice: 71.2, discount: "-20%" },
  { title: "THE KING OF FIGHTERS XV Deluxe Edition", originalPrice: 699, salePrice: 174.75, discount: "-75%" },
  { title: "Remnant II® - Ultimate Edition", originalPrice: 1239, salePrice: 247.8, discount: "-80%" },
  { title: "Ultimate General: Civil War", originalPrice: 529, salePrice: 264.5, discount: "-50%" },
  { title: "Divinity: Original Sin. La saga de la Fuente", originalPrice: 1228.43, salePrice: 491.37, discount: "-60%" },
  { title: "Escape Academy", originalPrice: 429, salePrice: 107.25, discount: "-75%" },
  { title: "Fuga: Melodies of Steel 3", originalPrice: 822.43, salePrice: 493.45, discount: "-40%" },
  { title: "Gord", originalPrice: 599, salePrice: 119.8, discount: "-80%" },
  { title: "Sniper Elite 5 Complete Edition", originalPrice: 1939, salePrice: 387.8, discount: "-80%" },
  { title: "Holdfast: Patriot Edition", originalPrice: 459, salePrice: 367.2, discount: "-20%" },
  { title: "Crashout Crew", originalPrice: 89, salePrice: 57.85, discount: "-35%" },
  { title: "Fallout 2", originalPrice: 199, salePrice: 49.75, discount: "-75%" },
  { title: "Bob Esponja: Titanes de la Marea", originalPrice: 709, salePrice: 496.3, discount: "-30%" },
  { title: "Hokko Life", originalPrice: 249.99, salePrice: 49.99, discount: "-80%" },
  { title: "ASTRONEER: Evolution Edition", originalPrice: 709, salePrice: 177.25, discount: "-75%" },
  { title: "Quake 4", originalPrice: 269, salePrice: 88.77, discount: "-67%" },
  { title: "REANIMAL - Digital Deluxe Edition", originalPrice: 1059, salePrice: 794.25, discount: "-25%" },
  { title: "DOOM Eternal Standard Edition (PC)", originalPrice: 599, salePrice: 197.67, discount: "-67%" },
  { title: "Riven", originalPrice: 619, salePrice: 495.2, discount: "-20%" },
  { title: "Holdfast: Ultimate Edition", originalPrice: 914, salePrice: 731.2, discount: "-20%" },
  { title: "Wolfenstein: The Old Blood (PC)", originalPrice: 319, salePrice: 79.75, discount: "-75%" },
  { title: "The Jackbox Party Quadpack", originalPrice: 1349, salePrice: 1011.75, discount: "-25%" },
  { title: "Monster Energy Supercross 4 - Special Edition - Xbox Series X|S", originalPrice: 899, salePrice: 89.9, discount: "-90%" },
  { title: "Biomutant", originalPrice: 709, salePrice: 177.25, discount: "-75%" },
  { title: "Kristala", originalPrice: 709, salePrice: 425.4, discount: "-40%" },
  { title: "MX Unleashed", originalPrice: 249, salePrice: 49.8, discount: "-80%" },
  { title: "Monster Energy Supercross 4 - Xbox Series X|S", originalPrice: 549, salePrice: 54.9, discount: "-90%" },
  { title: "Darksiders Genesis", originalPrice: 719, salePrice: 71.9, discount: "-90%" },
  { title: "Warhammer 40,000: Rogue Trader - Deluxe Pack", originalPrice: 159, salePrice: 55.65, discount: "-65%" },
  { title: "Police Simulator: Patrol Officers: Gold Edition", originalPrice: 709, salePrice: 354.5, discount: "-50%" },
  { title: "Wolfenstein 3D", originalPrice: 89, salePrice: 26.7, discount: "-70%" },
  { title: "Superliminal", originalPrice: 429, salePrice: 171.6, discount: "-60%" },
  { title: "Monster Jam Steel Titans", originalPrice: 499, salePrice: 99.8, discount: "-80%" },
  { title: "Wolfenstein II: The New Colossus", originalPrice: 799, salePrice: 119.85, discount: "-85%" },
  { title: "6 Roguelite Games Collection", originalPrice: 529, salePrice: 423.2, discount: "-20%" },
  { title: "Cyber Tank Pink", originalPrice: 89, salePrice: 71.2, discount: "-20%" },
  { title: "Monster Jam Steel Titans 2", originalPrice: 709, salePrice: 141.8, discount: "-80%" },
  { title: "Don't Starve: Giant Edition", originalPrice: 199, salePrice: 49.75, discount: "-75%" },
  { title: "Remnant II® - Standard Edition", originalPrice: 879, salePrice: 219.75, discount: "-75%" },
  { title: "DUSK", originalPrice: 349, salePrice: 261.75, discount: "-25%" },
  { title: "SpongeBob: Truth-Sq.", originalPrice: 299, salePrice: 74.75, discount: "-75%" },
  { title: "Bob Esponja: The Cosmic Shake", originalPrice: 709, salePrice: 354.5, discount: "-50%" },
  { title: "Wreckfest Complete Edition", originalPrice: 879, salePrice: 263.7, discount: "-70%" },
  { title: "Mechaconda", originalPrice: 141, salePrice: 105.75, discount: "-25%" },
  { title: "MX vs. ATV Alive", originalPrice: 299, salePrice: 59.8, discount: "-80%" },
  { title: "Destroy All Humans! 2 - Reprobed", originalPrice: 709, salePrice: 354.5, discount: "-50%" },
  { title: "Cats and Seek : Tokyo", originalPrice: 53, salePrice: 42.4, discount: "-20%" },
  { title: "TopSpin 2K25 Edición Deluxe", originalPrice: 599, salePrice: 449.25, discount: "-25%" },
  { title: "Wreckreation", originalPrice: 709, salePrice: 425.4, discount: "-40%" },
  { title: "Paquete de expansión de DOOM Eternal: The Ancient Gods (PC)", originalPrice: 399, salePrice: 279.3, discount: "-30%" },
  { title: "Way of the Hunter - Ultimate Edition", originalPrice: 1239, salePrice: 371.7, discount: "-70%" },
  { title: "The Jackbox Party Pack 10", originalPrice: 529, salePrice: 290.95, discount: "-45%" },
  { title: "Myst", originalPrice: 798, salePrice: 478.8, discount: "-40%" },
  { title: "Tiny Witch", originalPrice: 177, salePrice: 141.6, discount: "-20%" },
  { title: "Spray Paint Simulator", originalPrice: 269, salePrice: 201.75, discount: "-25%" },
  { title: "Old Market Simulator", originalPrice: 269, salePrice: 201.75, discount: "-25%" },
  { title: "Construction Simulator - Gold Edition", originalPrice: 709, salePrice: 354.5, discount: "-50%" },
  { title: "The Elder Scrolls III: Morrowind Game of the Year Edition (PC)", originalPrice: 159, salePrice: 63.6, discount: "-60%" },
  { title: "Call of the Wild: The Angler™ - Ultimate Fishing Bundle", originalPrice: 1239, salePrice: 619.5, discount: "-50%" },
  { title: "Chess Battle", originalPrice: 71, salePrice: 53.25, discount: "-25%" },
  { title: "Cyber Tank Pink (Xbox One)", originalPrice: 89, salePrice: 71.2, discount: "-20%" },
  { title: "Quake III Arena", originalPrice: 299, salePrice: 119.6, discount: "-60%" },
  { title: "Turnip Mountain", originalPrice: 185, salePrice: 148, discount: "-20%" },
  { title: "Gold Edition 6 in 1", originalPrice: 619, salePrice: 371.4, discount: "-40%" },
  { title: "The Renovator: Origins", originalPrice: 269, salePrice: 134.5, discount: "-50%" },
  { title: "Titan Quest", originalPrice: 399, salePrice: 59.85, discount: "-85%" },
  { title: "Trident's Tale", originalPrice: 199, salePrice: 79.6, discount: "-60%" },
  { title: "The Evil Within® 2 (PC)", originalPrice: 799, salePrice: 159.8, discount: "-80%" },
  { title: "Darksiders III", originalPrice: 709, salePrice: 70.9, discount: "-90%" },
  { title: "Dishonored 2", originalPrice: 599, salePrice: 119.8, discount: "-80%" },
  { title: "DOOM Eternal Deluxe Edition (PC)", originalPrice: 999, salePrice: 329.67, discount: "-67%" },
  { title: "The 7th Guest Remake", originalPrice: 319, salePrice: 223.3, discount: "-30%" },
  { title: "Return to Monkey Island", originalPrice: 439, salePrice: 109.75, discount: "-75%" },
  { title: "Bus Driving Simulator : EVO", originalPrice: 349, salePrice: 174.5, discount: "-50%" },
  { title: "Outcast - A New Beginning", originalPrice: 709, salePrice: 354.5, discount: "-50%" },
  { title: "Fuga: Melodies of Steel 1 & 2 - Pack doble", originalPrice: 1480.37, salePrice: 740.18, discount: "-50%" },
  { title: "Fallout Tactics", originalPrice: 199, salePrice: 49.75, discount: "-75%" },
  { title: "Children of Morta", originalPrice: 389, salePrice: 58.35, discount: "-85%" },
  { title: "Sid Meier's Civilization® VI Anthology (Windows PC)", originalPrice: 1400, salePrice: 560, discount: "-60%" },
  { title: "Arx Fatalis", originalPrice: 99, salePrice: 32.67, discount: "-67%" },
  { title: "Baja: Edge of Control HD", originalPrice: 399, salePrice: 99.75, discount: "-75%" },
  { title: "Generation Zero® - Ultimate Bundle", originalPrice: 1589, salePrice: 794.5, discount: "-50%" },
  { title: "Trine 5: A Clockwork Conspiracy", originalPrice: 529, salePrice: 211.6, discount: "-60%" },
  { title: "Funko Fusion - Fantastik Plastik Bundle", originalPrice: 89, salePrice: 35.6, discount: "-60%" },
  { title: "Creepy Shift: House For Sale", originalPrice: 177, salePrice: 118.59, discount: "-33%" },
  { title: "Loop Hero", originalPrice: 269, salePrice: 53.8, discount: "-80%" },
  { title: "Dishonored® Definitive Edition (PC)", originalPrice: 399, salePrice: 99.75, discount: "-75%" },
  { title: "MX vs. ATV Supercross Encore", originalPrice: 399, salePrice: 79.8, discount: "-80%" },
  { title: "Darksiders II Deathinitive Edition", originalPrice: 399, salePrice: 39.9, discount: "-90%" },
  { title: "Holdfast: Great War Edition", originalPrice: 459, salePrice: 298.35, discount: "-35%" },
  { title: "Remnant: From the Ashes - Complete Edition", originalPrice: 879, salePrice: 175.8, discount: "-80%" },
  { title: "Airplane Flight Simulator : EVO", originalPrice: 339, salePrice: 169.5, discount: "-50%" },
  { title: "ELEX II", originalPrice: 1059, salePrice: 211.8, discount: "-80%" },
  { title: "Speed dates - Winter edition", originalPrice: 105, salePrice: 63, discount: "-40%" },
  { title: "WRC Collection Vol. 1 Xbox One", originalPrice: 879, salePrice: 659.25, discount: "-25%" },
  { title: "Floor 9", originalPrice: 105, salePrice: 63, discount: "-40%" },
  { title: "The Outfit", originalPrice: 199, salePrice: 39.8, discount: "-80%" },
  { title: "Dig or Die: Console Edition", originalPrice: 177, salePrice: 88.5, discount: "-50%" },
  { title: "Hell Let Loose - The Eagle and Pegasus Combo Pack", originalPrice: 135, salePrice: 44.55, discount: "-67%" },
  { title: "ISLANDERS: New Shores - The Full Archipelago Bundle", originalPrice: 269, salePrice: 134.5, discount: "-50%" },
  { title: "Meow Moments: Celebrating Myth & Machine", originalPrice: 53, salePrice: 42.4, discount: "-20%" },
  { title: "Don't Be Afraid y The Great Perhaps Paquete", originalPrice: 269, salePrice: 215.2, discount: "-20%" },
  { title: "Airplane Flight Simulator : Combat Zone", originalPrice: 339, salePrice: 169.5, discount: "-50%" },
  { title: "Ruiner", originalPrice: 349, salePrice: 34.9, discount: "-90%" },
  { title: "Elex", originalPrice: 709, salePrice: 141.8, discount: "-80%" },
  { title: "Funko Fusion - Jurassic World Rebirth DLC Bundle", originalPrice: 141, salePrice: 56.4, discount: "-60%" },
  { title: "Way of the Hunter: Elite Edition", originalPrice: 799, salePrice: 239.7, discount: "-70%" },
  { title: "Aven Colony - Deluxe Edition", originalPrice: 429, salePrice: 85.8, discount: "-80%" },
  { title: "Alchemist: Journey of The Soul", originalPrice: 209, salePrice: 167.2, discount: "-20%" },
  { title: "Jagged Alliance 3", originalPrice: 1059, salePrice: 317.7, discount: "-70%" },
  { title: "Crown Trick", originalPrice: 249.99, salePrice: 62.49, discount: "-75%" },
  { title: "Frontlines:Fuel of War", originalPrice: 249, salePrice: 62.25, discount: "-75%" },
  { title: "Risen", originalPrice: 529, salePrice: 211.6, discount: "-60%" },
  { title: "Fade to Silence", originalPrice: 519, salePrice: 129.75, discount: "-75%" },
  { title: "Hell Let Loose - U.S Bundle", originalPrice: 135, salePrice: 67.5, discount: "-50%" },
  { title: "Destroy All Humans!", originalPrice: 529, salePrice: 158.7, discount: "-70%" },
  { title: "Darksiders Genesis", originalPrice: 709, salePrice: 177.25, discount: "-75%" },
  { title: "Kingdoms of Amalur: Re-Reckoning", originalPrice: 709, salePrice: 141.8, discount: "-80%" },
  { title: "Stuntman: Ignition", originalPrice: 199, salePrice: 49.75, discount: "-75%" },
  { title: "DIMENSIONS 2", originalPrice: 269, salePrice: 134.5, discount: "-50%" },
  { title: "Deep Rock Galactic - Deluxe Edition", originalPrice: 709, salePrice: 212.7, discount: "-70%" },
  { title: "Meow Moments Bundle", originalPrice: 177, salePrice: 141.6, discount: "-20%" },
  { title: "Darksiders III - Blades & Whip Edition", originalPrice: 1599, salePrice: 159.9, discount: "-90%" },
  { title: "Blood West: Gold Edition", originalPrice: 639, salePrice: 479.25, discount: "-25%" },
  { title: "Full Spectrum Warrior", originalPrice: 249, salePrice: 62.25, discount: "-75%" },
  { title: "Fading Clouds (Xbox Series)", originalPrice: 89, salePrice: 71.2, discount: "-20%" },
  { title: "Stay Still", originalPrice: 177, salePrice: 106.2, discount: "-40%" },
  { title: "Car Mechanic Shop Simulator", originalPrice: 141, salePrice: 70.5, discount: "-50%" },
  { title: "Lost Ember: Rekindled Edition", originalPrice: 529, salePrice: 264.5, discount: "-50%" },
  { title: "KIBORG + DESCENT", originalPrice: 619, salePrice: 402.35, discount: "-35%" },
  { title: "Harvest Cafe", originalPrice: 185, salePrice: 129.5, discount: "-30%" },
  { title: "Fuga: Melodies of Steel", originalPrice: 822.43, salePrice: 411.21, discount: "-50%" },
  { title: "The Elder Scrolls Adventures: Redguard", originalPrice: 107, salePrice: 42.8, discount: "-60%" },
  { title: "Fading Clouds (Xbox One)", originalPrice: 89, salePrice: 71.2, discount: "-20%" },
  { title: "Holdfast: Age Of Sail Edition", originalPrice: 459, salePrice: 367.2, discount: "-20%" },
  { title: "Bioweaver", originalPrice: 123, salePrice: 79.95, discount: "-35%" },
  { title: "Blood West", originalPrice: 439, salePrice: 329.25, discount: "-25%" },
  { title: "ANNO : Mutationem", originalPrice: 349, salePrice: 174.5, discount: "-50%" },
  { title: "Cannon Brawl", originalPrice: 129, salePrice: 64.5, discount: "-50%" },
  { title: "The Sinking Forest - 沈んだ森", originalPrice: 177, salePrice: 106.2, discount: "-40%" },
  { title: "Destroy All Humans!", originalPrice: 299, salePrice: 59.8, discount: "-80%" },
  { title: "Greedland", originalPrice: 229, salePrice: 160.3, discount: "-30%" },
  { title: "Keeper's Toll", originalPrice: 123, salePrice: 92.25, discount: "-25%" },
  { title: "Moving Houses", originalPrice: 229, salePrice: 137.4, discount: "-40%" },
  { title: "This War of Mine: Final Cut", originalPrice: 349, salePrice: 52.35, discount: "-85%" },
  { title: "Top Racer Collection", originalPrice: 349, salePrice: 191.95, discount: "-45%" },
  { title: "Caveman Trials (XBox Series)", originalPrice: 89, salePrice: 62.3, discount: "-30%" },
  { title: "Epic Chef", originalPrice: 500, salePrice: 100, discount: "-80%" },
  { title: "Trash Goblin", originalPrice: 349, salePrice: 279.2, discount: "-20%" },
  { title: "Bag Fight: Starter Pack", originalPrice: 249, salePrice: 174.3, discount: "-30%" },
  { title: "Caveman Trials", originalPrice: 89, salePrice: 62.3, discount: "-30%" },
  { title: "Spot Stories Vol. 1", originalPrice: 89, salePrice: 59.63, discount: "-33%" },
  { title: "Hell Let Loose - German Bundle", originalPrice: 135, salePrice: 67.5, discount: "-50%" },
  { title: "An Elder Scrolls Legend: Battlespire", originalPrice: 107, salePrice: 42.8, discount: "-60%" },
  { title: "9th Dawn Remake", originalPrice: 279, salePrice: 111.6, discount: "-60%" },
  { title: "de Blob", originalPrice: 249, salePrice: 24.9, discount: "-90%" },
  { title: "Little Droid", originalPrice: 105, salePrice: 68.25, discount: "-35%" },
  { title: "Shy Dogs Hidden Orchestra 2", originalPrice: 105, salePrice: 70.35, discount: "-33%" },
  { title: "Smart Moves", originalPrice: 89, salePrice: 26.7, discount: "-70%" },
  { title: "Moves: Perfect Pair", originalPrice: 89, salePrice: 62.3, discount: "-30%" },
  { title: "The Journey Down Trilogy", originalPrice: 529, salePrice: 264.5, discount: "-50%" },
  { title: "RAGE 2 (PC)", originalPrice: 799, salePrice: 159.8, discount: "-80%" },
  { title: "The Lord of the Rings: Adventure Card Game - Definitive Edition", originalPrice: 349, salePrice: 87.25, discount: "-75%" },
  { title: "Water Delivery", originalPrice: 141, salePrice: 56.4, discount: "-60%" },
  { title: "My Little Universe", originalPrice: 269, salePrice: 134.5, discount: "-50%" },
  { title: "Chronos: Before the Ashes", originalPrice: 529, salePrice: 132.25, discount: "-75%" },
  { title: "Sacred 2 Fallen Angel", originalPrice: 299, salePrice: 59.8, discount: "-80%" },
  { title: "Pawbay: Cozy Strays", originalPrice: 379, salePrice: 151.6, discount: "-60%" },
  { title: "Battle Chasers: Nightwar", originalPrice: 399, salePrice: 99.75, discount: "-75%" },
  { title: "SOPA DE LETRAS EN ESPAÑOL", originalPrice: 105, salePrice: 78.75, discount: "-25%" },
  { title: "Monster Survivors: Complete Edition", originalPrice: 123, salePrice: 73.8, discount: "-40%" },
  { title: "ParkingJam: Complete Edition", originalPrice: 123, salePrice: 73.8, discount: "-40%" },
  { title: "Moves: Perfect Pair (Xbox Series)", originalPrice: 89, salePrice: 62.3, discount: "-30%" },
  { title: "Funko Fusion - Wicked Movie DLC Bundle", originalPrice: 209, salePrice: 83.6, discount: "-60%" },
  { title: "Alone in the Dark - Digital Deluxe Edition", originalPrice: 879, salePrice: 439.5, discount: "-50%" },
  { title: "Bus Simulator 21 Next Stop - Gold Edition", originalPrice: 709, salePrice: 233.97, discount: "-67%" },
  { title: "Johnny Trigger", originalPrice: 89, salePrice: 53.4, discount: "-40%" },
  { title: "The Valiant", originalPrice: 439, salePrice: 131.7, discount: "-70%" },
  { title: "Fuga: Melodies of Steel 2", originalPrice: 822.43, salePrice: 411.21, discount: "-50%" },
  { title: "Fuga: Melodies of Steel 3 - Edición Deluxe", originalPrice: 1228.43, salePrice: 737.05, discount: "-40%" },
  { title: "A Building Full of Cats", originalPrice: 53, salePrice: 26.5, discount: "-50%" },
  { title: "Dracula's Legacy Remastered", originalPrice: 370.03, salePrice: 240.51, discount: "-35%" },
  { title: "BAD END THEATER", originalPrice: 123, salePrice: 92.25, discount: "-25%" },
  { title: "Acorn Avengers", originalPrice: 177, salePrice: 141.6, discount: "-20%" },
  { title: "Car Cops: Complete Edition", originalPrice: 105, salePrice: 78.75, discount: "-25%" },
  { title: "Mark of the Ninja: Remastered", originalPrice: 249, salePrice: 62.25, discount: "-75%" },
  { title: "Moonglow Bay", originalPrice: 439, salePrice: 87.8, discount: "-80%" },
  { title: "Star Trucker - Deluxe Bundle", originalPrice: 529, salePrice: 290.95, discount: "-45%" },
  { title: "Beacon Pines", originalPrice: 349, salePrice: 104.7, discount: "-70%" },
  { title: "OlliOlli World Rad Edition", originalPrice: 599, salePrice: 197.67, discount: "-67%" },
  { title: "Galacticare", originalPrice: 529, salePrice: 343.85, discount: "-35%" },
  { title: "Griftlands", originalPrice: 349, salePrice: 122.15, discount: "-65%" },
  { title: "50 Years", originalPrice: 89, salePrice: 26.7, discount: "-70%" },
  { title: "Meet Your Maker: Lote Sector 1", originalPrice: 133, salePrice: 66.5, discount: "-50%" },
  { title: "Sparkle Bundle", originalPrice: 209, salePrice: 167.2, discount: "-20%" },
  { title: "KIBORG", originalPrice: 529, salePrice: 343.85, discount: "-35%" },
  { title: "Remnant: From the Ashes", originalPrice: 709, salePrice: 141.8, discount: "-80%" },
  { title: "Decollate Decoration", originalPrice: 159, salePrice: 111.3, discount: "-30%" },
  { title: "Moonlighter", originalPrice: 349, salePrice: 52.35, discount: "-85%" },
  { title: "Observation", originalPrice: 439, salePrice: 65.85, discount: "-85%" },
  { title: "Sable", originalPrice: 439, salePrice: 109.75, discount: "-75%" },
  { title: "Baking Time: Complete Edition", originalPrice: 123, salePrice: 73.8, discount: "-40%" },
  { title: "Hammerwatch: Heroic Bundle", originalPrice: 439, salePrice: 351.2, discount: "-20%" },
  { title: "Escape Room Master Collection", originalPrice: 1149, salePrice: 919.2, discount: "-20%" },
  { title: "Ancient and Arcane - Escape Room Bundle", originalPrice: 709, salePrice: 567.2, discount: "-20%" },
  { title: "Zombie Army 4 Complete Edition", originalPrice: 2119, salePrice: 423.8, discount: "-80%" },
  { title: "PERISH", originalPrice: 349, salePrice: 69.8, discount: "-80%" },
  { title: "Beat The Champions", originalPrice: 349, salePrice: 261.75, discount: "-25%" },
  { title: "Destroy All Humans! 2 - Reprobed: Single Player (X1)", originalPrice: 529, salePrice: 211.6, discount: "-60%" },
  { title: "DCL-The Game", originalPrice: 719, salePrice: 71.9, discount: "-90%" },
  { title: "Lost Twins 2", originalPrice: 349, salePrice: 157.05, discount: "-55%" },
  { title: "Rage Swarm: Complete Edition", originalPrice: 123, salePrice: 73.8, discount: "-40%" },
  { title: "Tales of Berseria Remastered - Paquete de mejora Deluxe", originalPrice: 469, salePrice: 351.75, discount: "-25%" },
  { title: "Train Valley Collection", originalPrice: 529, salePrice: 264.5, discount: "-50%" },
  { title: "Kitten Island", originalPrice: 89, salePrice: 44.5, discount: "-50%" },
  { title: "Fuga: Melodies of Steel 2 - Edición Definitiva", originalPrice: 1384.31, salePrice: 692.15, discount: "-50%" },
  { title: "Sissa's Path", originalPrice: 89, salePrice: 31.15, discount: "-65%" },
  { title: "The Elder Scrolls V: Skyrim Anniversary Edition (PC) + Fallout 4: Anniversary Edition Bundle", originalPrice: 1799, salePrice: 1079.4, discount: "-40%" },
  { title: "Destroy All Humans! 2 - Reprobed: Dressed to Skill Edition", originalPrice: 969, salePrice: 290.7, discount: "-70%" },
  { title: "Skelethrone: The Chronicles of Ericona - Complete Edition", originalPrice: 339, salePrice: 152.55, discount: "-55%" },
  { title: "This Is the Police", originalPrice: 249, salePrice: 49.8, discount: "-80%" },
  { title: "Card Collector Trading Shop", originalPrice: 141, salePrice: 70.5, discount: "-50%" },
  { title: "Sword of the Vagrant", originalPrice: 239, salePrice: 71.7, discount: "-70%" },
  { title: "Desperados III Deluxe Edition", originalPrice: 879, salePrice: 175.8, discount: "-80%" },
  { title: "Foot Clinic", originalPrice: 89, salePrice: 57.85, discount: "-35%" },
  { title: "NORCO", originalPrice: 269, salePrice: 94.15, discount: "-65%" },
  { title: "Escape First Alchemist", originalPrice: 141, salePrice: 84.6, discount: "-40%" },
  { title: "Dreamscapes - The Sandman", originalPrice: 349, salePrice: 226.85, discount: "-35%" },
  { title: "Hell Let Loose - Fan Favourites Bundle", originalPrice: 215, salePrice: 107.5, discount: "-50%" },
  { title: "8-Ball Pocket", originalPrice: 105, salePrice: 36.75, discount: "-65%" },
  { title: "ChildStory", originalPrice: 123, salePrice: 98.4, discount: "-20%" },
  { title: "Kingdom Two Crowns: Olympus Edition", originalPrice: 459, salePrice: 183.6, discount: "-60%" },
  { title: "Fuga: Melodies of Steel - Edición Definitiva", originalPrice: 1384.31, salePrice: 692.15, discount: "-50%" },
  { title: "Hell Let Loose - Soviet Bundle", originalPrice: 135, salePrice: 67.5, discount: "-50%" },
  { title: "Void Blasters (Xbox One)", originalPrice: 79, salePrice: 55.3, discount: "-30%" },
  { title: "Meet Your Maker: Lote Sector 2", originalPrice: 119, salePrice: 59.5, discount: "-50%" },
  { title: "Hell Let Loose - Headgear Bundle", originalPrice: 135, salePrice: 67.5, discount: "-50%" },
  { title: "Darksiders III", originalPrice: 809, salePrice: 202.25, discount: "-75%" },
  { title: "INDIKA", originalPrice: 439, salePrice: 175.6, discount: "-60%" },
  { title: "AEW: Fight Forever - Ultimate Edition", originalPrice: 1769, salePrice: 530.7, discount: "-70%" },
  { title: "Harvest Moon: Light of Hope SE Complete", originalPrice: 529, salePrice: 264.5, discount: "-50%" },
  { title: "Atomfall Complete Edition", originalPrice: 1589, salePrice: 635.6, discount: "-60%" },
  { title: "Raptor Evolution: Complete Edition", originalPrice: 159, salePrice: 103.35, discount: "-35%" },
  { title: "Rescue & Protect Bundle: Firefighting Police", originalPrice: 1059, salePrice: 582.45, discount: "-45%" },
  { title: "Skelethrone: The Chronicles of Ericona", originalPrice: 269, salePrice: 121.05, discount: "-55%" },
  { title: "SpellForce: Conquest of Eo", originalPrice: 529, salePrice: 211.6, discount: "-60%" },
  { title: "Citizen Sleeper: Helion Collection", originalPrice: 709, salePrice: 319.05, discount: "-55%" },
  { title: "Leisure Suit Larry - Wet Dreams Don't Dry", originalPrice: 822.43, salePrice: 41.12, discount: "-95%" },
  { title: "The Escapists: Supermax Edition", originalPrice: 414, salePrice: 331.2, discount: "-20%" },
  { title: "Hidden Memory - Nature", originalPrice: 89, salePrice: 71.2, discount: "-20%" },
  { title: "Happi Basudei", originalPrice: 89, salePrice: 17.8, discount: "-80%" },
  { title: "Wolfenstein: Youngblood - PC", originalPrice: 399, salePrice: 99.75, discount: "-75%" },
  { title: "Baki Hanma: Blood Arena", originalPrice: 529, salePrice: 317.4, discount: "-40%" },
  { title: "Post Trauma", originalPrice: 269, salePrice: 134.5, discount: "-50%" },
  { title: "Christmas Mutilator", originalPrice: 177, salePrice: 106.2, discount: "-40%" },
  { title: "Beat 'Em Up Collection (QUByte Classics)", originalPrice: 349, salePrice: 191.95, discount: "-45%" },
  { title: "SOUTH PARK: SNOW DAY! Digital Deluxe", originalPrice: 879, salePrice: 351.6, discount: "-60%" },
  { title: "Leisure Suit Larry - Wet Dreams Saga Bundle", originalPrice: 1332.83, salePrice: 66.64, discount: "-95%" },
  { title: "Crash Drive 3", originalPrice: 429, salePrice: 128.7, discount: "-70%" },
  { title: "Sacred 3", originalPrice: 299, salePrice: 59.8, discount: "-80%" },
  { title: "This is the Police 2", originalPrice: 399, salePrice: 79.8, discount: "-80%" },
  { title: "Leisure Suit Larry - Wet Dreams Dry Twice", originalPrice: 822.43, salePrice: 41.12, discount: "-95%" },
  { title: "Snufkin: Melody of Moominvalley - Digital Deluxe Edition", originalPrice: 419, salePrice: 230.45, discount: "-45%" },
  { title: "Saccharine Echo", originalPrice: 89, salePrice: 66.75, discount: "-25%" },
  { title: "Project 13: Nightwatch", originalPrice: 105, salePrice: 42, discount: "-60%" },
  { title: "Soccer Kid Collection (QUByte Classics)", originalPrice: 177, salePrice: 132.75, discount: "-25%" },
  { title: "Dentist Bling: Complete Edition", originalPrice: 123, salePrice: 73.8, discount: "-40%" },
  { title: "Venba", originalPrice: 269, salePrice: 88.77, discount: "-67%" },
  { title: "Chess Gambit", originalPrice: 177, salePrice: 88.5, discount: "-50%" },
  { title: "The Raven Remastered", originalPrice: 399, salePrice: 79.8, discount: "-80%" },
  { title: "Hidden Memory - Neko's Life", originalPrice: 89, salePrice: 71.2, discount: "-20%" },
  { title: "Dungeon Minesweeper", originalPrice: 105, salePrice: 78.75, discount: "-25%" },
  { title: "Tales of Xillia remasterizado: paquete de mejora Deluxe", originalPrice: 509, salePrice: 381.75, discount: "-25%" },
  { title: "Draconic Resurgence", originalPrice: 89, salePrice: 44.5, discount: "-50%" },
  { title: "Void Blasters", originalPrice: 79, salePrice: 55.3, discount: "-30%" },
  { title: "Pile Up! Box by Box", originalPrice: 269, salePrice: 134.5, discount: "-50%" },
  { title: "DARKGEMS (Xbox Series)", originalPrice: 89, salePrice: 17.8, discount: "-80%" },
  { title: "Hole io & Mob Control", originalPrice: 141, salePrice: 70.5, discount: "-50%" },
  { title: "DARKGEMS", originalPrice: 89, salePrice: 17.8, discount: "-80%" },
  { title: "AQUADREAM", originalPrice: 89, salePrice: 62.3, discount: "-30%" },
  { title: "AQUADREAM (XBOX SERIES)", originalPrice: 89, salePrice: 62.3, discount: "-30%" },
  { title: "ISLANDERS: New Shores - The Scenic Builders Pack", originalPrice: 209, salePrice: 104.5, discount: "-50%" },
  { title: "The Cub", originalPrice: 269, salePrice: 107.6, discount: "-60%" },
  { title: "SpellForce III Reforced: Complete Edition", originalPrice: 1059, salePrice: 317.7, discount: "-70%" },
  { title: "New Tales from the Borderlands: Edición Deluxe", originalPrice: 1049, salePrice: 524.5, discount: "-50%" },
  { title: "Chicken Police - Paint it RED!", originalPrice: 349, salePrice: 87.25, discount: "-75%" },
  { title: "FRONT MISSION 1st: Remake", originalPrice: 619, salePrice: 154.75, discount: "-75%" },
  { title: "Black Mirror", originalPrice: 499, salePrice: 124.75, discount: "-75%" },
  { title: "ABRISS - build to destroy", originalPrice: 269, salePrice: 80.7, discount: "-70%" },
  { title: "Snow Squall", originalPrice: 177, salePrice: 35.4, discount: "-80%" },
  { title: "Realpolitiks New Power", originalPrice: 439, salePrice: 43.9, discount: "-90%" },
  { title: "Magical Delicacy", originalPrice: 439, salePrice: 241.45, discount: "-45%" },
  { title: "Little Big Workshop", originalPrice: 349, salePrice: 69.8, discount: "-80%" },
  { title: "DEMON'S TILT", originalPrice: 404.83, salePrice: 121.44, discount: "-70%" },
  { title: "Bioprototype", originalPrice: 123, salePrice: 79.95, discount: "-35%" },
  { title: "RollCats", originalPrice: 349, salePrice: 174.5, discount: "-50%" },
  { title: "Risky Roads", originalPrice: 89, salePrice: 57.85, discount: "-35%" },
  { title: "Diamond Painting ASMR: Complete Edition", originalPrice: 141, salePrice: 98.7, discount: "-30%" },
  { title: "Trinity Fusion Deluxe Edition", originalPrice: 529, salePrice: 158.7, discount: "-70%" },
  { title: "Tales of Graces f Remastered - Paquete de mejora Deluxe", originalPrice: 489, salePrice: 366.75, discount: "-25%" },
  { title: "SpotCat vs The Cheddar Mafia In The Americas", originalPrice: 89, salePrice: 53.4, discount: "-40%" },
  { title: "ISLANDERS: New Shores - Island Hopping Bundle", originalPrice: 239, salePrice: 155.35, discount: "-35%" },
  { title: "Puzzle Islands: Ancient & Modern - Bundle", originalPrice: 99, salePrice: 79.2, discount: "-20%" },
  { title: "Color Water Sort: Complete Edition", originalPrice: 141, salePrice: 84.6, discount: "-40%" },
  { title: "Speedollama", originalPrice: 159, salePrice: 23.85, discount: "-85%" },
  { title: "Robolifter", originalPrice: 105, salePrice: 21, discount: "-80%" },
  { title: "D.U.M.B.E.R. Ducks", originalPrice: 89, salePrice: 71.2, discount: "-20%" },
  { title: "BUTCHER", originalPrice: 129, salePrice: 32.25, discount: "-75%" },
  { title: "Risen 2™: Dark Waters", originalPrice: 299, salePrice: 59.8, discount: "-80%" },
  { title: "Accolade Sports Collection (QUByte Classics)", originalPrice: 349, salePrice: 174.5, discount: "-50%" },
  { title: "Great God Grove", originalPrice: 349, salePrice: 174.5, discount: "-50%" },
  { title: "Street Racer Collection (QUByte Classics)", originalPrice: 349, salePrice: 191.95, discount: "-45%" },
  { title: "Risen (2009)", originalPrice: 299, salePrice: 59.8, discount: "-80%" },
  { title: "Spellcaster University", originalPrice: 349, salePrice: 174.5, discount: "-50%" },
  { title: "de Blob 2", originalPrice: 299, salePrice: 29.9, discount: "-90%" },
  { title: "Remnant II® - Deluxe Edition", originalPrice: 1059, salePrice: 264.75, discount: "-75%" },
  { title: "Whacking Hell!", originalPrice: 167, salePrice: 83.5, discount: "-50%" },
  { title: "Holdfast: Napoleonic Edition", originalPrice: 574, salePrice: 373.1, discount: "-35%" },
  { title: "Arkham Horror: Mother’s Embrace", originalPrice: 349, salePrice: 87.25, discount: "-75%" },
  { title: "EA SPORTS FC™ 26 Edición Estándar para Xbox One y Xbox Series X|S", originalPrice: 1399, salePrice: 97.93, discount: "-93%" },
  { title: "EA SPORTS FC™ 26 The World's Game Edition para Xbox One y Xbox Series X|S", originalPrice: 1799, salePrice: 449.75, discount: "-75%" },
  { title: "Red Dead Redemption", originalPrice: 999, salePrice: 499.50, discount: "-50%" },
  { title: "Call of Duty® Black Ops III: Zombies Chronicles Edition", originalPrice: 1300, salePrice: 429.00, discount: "-67%" },
  { title: "Red Dead Redemption 2: Edición Definitiva", originalPrice: 1999, salePrice: 399.80, discount: "-80%" },
  { title: "Red Dead Redemption 2", originalPrice: 1199, salePrice: 299.75, discount: "-75%" },
  { title: "DRAGON BALL XENOVERSE 2", originalPrice: 339, salePrice: 84.75, discount: "-75%" },
  { title: "NBA 2K26 Edición Estándar", originalPrice: 1399, salePrice: 139.90, discount: "-90%" },
  { title: "Golf With Your Friends", originalPrice: 389, salePrice: 38.90, discount: "-90%" },
  { title: "DRAGON BALL FighterZ", originalPrice: 1019, salePrice: 101.90, discount: "-90%" },
  { title: "Grand Theft Auto: The Trilogy – The Definitive Edition", originalPrice: 1199, salePrice: 395.67, discount: "-67%" },
  { title: "Little Nightmares III", originalPrice: 819, salePrice: 409.50, discount: "-50%" },
  { title: "A Way Out", originalPrice: 600, salePrice: 180.00, discount: "-70%" },
  { title: "ACE COMBAT™ 7: SKIES UNKNOWN", originalPrice: 1398, salePrice: 209.70, discount: "-85%" },
  { title: "Metro Saga Bundle", originalPrice: 1159, salePrice: 173.85, discount: "-85%" },
  { title: "It Takes Two - Versión digital", originalPrice: 894, salePrice: 268.20, discount: "-70%" },
  { title: "Batman: Arkham Collection", originalPrice: 1547.62, salePrice: 232.14, discount: "-85%" },
  { title: "Kingdom Come: Deliverance", originalPrice: 599, salePrice: 119.80, discount: "-80%" },
  { title: "Mortal Kombat XL", originalPrice: 714.29, salePrice: 178.57, discount: "-75%" },
  { title: "Sea of Thieves: 2026 Edition", originalPrice: 1099, salePrice: 384.65, discount: "-65%" },
  { title: "JoJo's Bizarre Adventure: All-Star Battle R", originalPrice: 1099.99, salePrice: 219.99, discount: "-80%" },
  { title: "DRAGON BALL Z: KAKAROT", originalPrice: 409, salePrice: 286.30, discount: "-30%" },
  { title: "NARUTO TO BORUTO: SHINOBI STRIKER", originalPrice: 359, salePrice: 89.75, discount: "-75%" },
  { title: "TEKKEN 7", originalPrice: 1097, salePrice: 219.40, discount: "-80%" },
  { title: "Castle Crashers Remastered", originalPrice: 230.83, salePrice: 115.41, discount: "-50%" },
  { title: "Mortal Kombat 11 Ultimate", originalPrice: 999, salePrice: 149.85, discount: "-85%" },
  { title: "Colección LEGO® Marvel", originalPrice: 1305.95, salePrice: 195.89, discount: "-85%" },
  { title: "Insurgency: Sandstorm", originalPrice: 799, salePrice: 199.75, discount: "-75%" },
  { title: "Injustice™ 2 - Legendary Edition", originalPrice: 1539.29, salePrice: 153.92, discount: "-90%" },
  { title: "Tom Clancy's Rainbow Six Siege: Elite Edition", originalPrice: 399, salePrice: 199.50, discount: "-50%" },
  { title: "Need for Speed™ Heat Edición Deluxe", originalPrice: 1496, salePrice: 74.80, discount: "-95%" },
  { title: "STAR WARS™ Battlefront™ II", originalPrice: 459, salePrice: 114.75, discount: "-75%" },
  { title: "LEGO® Jurassic World™", originalPrice: 830.95, salePrice: 166.19, discount: "-80%" },
  { title: "Destiny 2: La colección", originalPrice: 1099, salePrice: 384.65, discount: "-65%" },
  { title: "Call of Duty®: Infinite Warfare - Ed. Lanzamiento", originalPrice: 1195, salePrice: 394.35, discount: "-67%" },
  { title: "Watch Dogs®2", originalPrice: 999, salePrice: 99.90, discount: "-90%" },
  { title: "Mad Max", originalPrice: 698, salePrice: 174.50, discount: "-75%" },
  { title: "Slime Rancher", originalPrice: 231, salePrice: 57.75, discount: "-75%" },
  { title: "The Dark Pictures Anthology: House of Ashes", originalPrice: 753.99, salePrice: 248.81, discount: "-67%" },
  { title: "Cyberpunk 2077", originalPrice: 1230, salePrice: 369.00, discount: "-70%" },
  { title: "La Tierra Media™: Sombras de Guerra™ - Edición Definitiva", originalPrice: 1546.43, salePrice: 154.64, discount: "-90%" },
  { title: "Mafia Trilogy", originalPrice: 1499.99, salePrice: 299.99, discount: "-80%" },
  { title: "Mass Effect™ Legendary Edition", originalPrice: 1398, salePrice: 139.80, discount: "-90%" },
  { title: "BioShock: The Collection", originalPrice: 1207.96, salePrice: 241.59, discount: "-80%" },
  { title: "ONE PIECE World Seeker", originalPrice: 1507.99, salePrice: 150.79, discount: "-90%" },
  { title: "A Plague Tale: Innocence", originalPrice: 799, salePrice: 159.80, discount: "-80%" },
  { title: "The Dark Pictures Anthology: The Devil in Me", originalPrice: 829, salePrice: 331.60, discount: "-60%" },
  { title: "SOULCALIBUR VI", originalPrice: 1394.31, salePrice: 209.14, discount: "-85%" },
  { title: "Saints Row IV: Re-Elected & Gat out of Hell", originalPrice: 399, salePrice: 59.85, discount: "-85%" },
  { title: "Spyro™ Reignited Trilogy", originalPrice: 999, salePrice: 349.65, discount: "-65%" },
  { title: "NARUTO X BORUTO Ultimate Ninja STORM CONNECTIONS", originalPrice: 1019, salePrice: 407.60, discount: "-60%" },
  { title: "Stellaris: Console Edition", originalPrice: 709, salePrice: 177.25, discount: "-75%" },
  { title: "The Texas Chain Saw Massacre", originalPrice: 269, salePrice: 67.25, discount: "-75%" },
  { title: "Subnautica", originalPrice: 698, salePrice: 174.50, discount: "-75%" },
  { title: "NARUTO SHIPPUDEN™: Ultimate Ninja® STORM 4 ROAD TO BORUTO", originalPrice: 849, salePrice: 339.60, discount: "-60%" },
  { title: "Tomb Raider: Definitive Edition", originalPrice: 479, salePrice: 71.85, discount: "-85%" },
  { title: "Ni no Kuni II: El Renacer de un Reino - Prince's Edition", originalPrice: 1559, salePrice: 233.85, discount: "-85%" },
  { title: "Assassin's Creed Unity", originalPrice: 499, salePrice: 124.75, discount: "-75%" },
  { title: "Assassin's Creed Odyssey", originalPrice: 1195, salePrice: 179.25, discount: "-85%" },
  { title: "Minecraft Legends", originalPrice: 1099, salePrice: 439.60, discount: "-60%" },
  { title: "Wasteland Remastered", originalPrice: 399, salePrice: 99.75, discount: "-75%" },
  { title: "Jujutsu Kaisen Cursed Clash", originalPrice: 1019, salePrice: 254.75, discount: "-75%" },
  { title: "Tales of Symphonia Remastered", originalPrice: 799, salePrice: 119.85, discount: "-85%" },
  { title: "LEGO Marvel Super Heroes", originalPrice: 698, salePrice: 174.50, discount: "-75%" },
  { title: "The Dark Pictures Anthology: Man Of Medan", originalPrice: 419, salePrice: 209.50, discount: "-50%" },
  { title: "Risk of Rain 2", originalPrice: 400, salePrice: 100.00, discount: "-75%" },
  { title: "The Dark Pictures Anthology: Little Hope", originalPrice: 419, salePrice: 209.50, discount: "-50%" },
  { title: "Unravel Two", originalPrice: 439, salePrice: 65.85, discount: "-85%" },
  { title: "LEGO® DC Super-Villains Edición Deluxe", originalPrice: 1664.29, salePrice: 166.42, discount: "-90%" },
  { title: "DRAGON BALL: THE BREAKERS", originalPrice: 389, salePrice: 38.90, discount: "-90%" },
  { title: "Battlefield™ 1 Revolution", originalPrice: 838, salePrice: 83.80, discount: "-90%" },
  { title: "ONE PIECE: PIRATE WARRIORS 4", originalPrice: 729, salePrice: 182.25, discount: "-75%" },
  { title: "Marvel's Guardians of the Galaxy", originalPrice: 1249, salePrice: 187.35, discount: "-85%" },
  { title: "Far Cry Primal - Apex Edition", originalPrice: 639, salePrice: 95.85, discount: "-85%" },
  { title: "theHunter: Call of the Wild™", originalPrice: 399, salePrice: 59.85, discount: "-85%" },
  { title: "Deadlight: Director's Cut", originalPrice: 199, salePrice: 29.85, discount: "-85%" },
  { title: "ARCADE GAME SERIES 3-in-1 Pack", originalPrice: 157.75, salePrice: 78.87, discount: "-50%" },
  { title: "Crash Bandicoot™ N. Sane Trilogy", originalPrice: 999, salePrice: 399.60, discount: "-60%" },
  { title: "Ni no Kuni Wrath of the White Witch™ Remastered", originalPrice: 1039, salePrice: 207.80, discount: "-80%" },
  { title: "LEGO® CITY Undercover", originalPrice: 796, salePrice: 159.20, discount: "-80%" },
  { title: "Little Nightmares Complete Edition", originalPrice: 539, salePrice: 134.75, discount: "-75%" },
  { title: "Rise of the Tomb Raider: 20 Year Celebration", originalPrice: 589, salePrice: 88.35, discount: "-85%" },
  { title: "Metro Exodus Gold Edition", originalPrice: 738, salePrice: 110.70, discount: "-85%" },
  { title: "SCARLET NEXUS", originalPrice: 1200, salePrice: 180.00, discount: "-85%" },
  { title: "Burnout™ Paradise Remastered", originalPrice: 439, salePrice: 65.85, discount: "-85%" },
  { title: "Watch Dogs®2 - Edición Gold", originalPrice: 1599, salePrice: 159.90, discount: "-90%" },
  { title: "The Elder Scrolls V: Skyrim Anniversary Edition", originalPrice: 999, salePrice: 329.67, discount: "-67%" },

  { title: "Dead Island 2", originalPrice: 979, salePrice: 146.85, discount: "-85%" },
  { title: "Borderlands 3", originalPrice: 1146, salePrice: 114.60, discount: "-90%" },
  { title: "Terraria", originalPrice: 249, salePrice: 124.50, discount: "-50%" },
  { title: "Titanfall™ 2 Ultimate Edition", originalPrice: 635, salePrice: 95.25, discount: "-85%" },
  { title: "Battlefield™ 1", originalPrice: 439, salePrice: 43.90, discount: "-90%" },
  { title: "Batman: Arkham Knight Premium Edition", originalPrice: 1189.29, salePrice: 178.39, discount: "-85%" },
  { title: "Wobbly Life", originalPrice: 549, salePrice: 356.85, discount: "-35%" },
  { title: "WATCH_DOGS™ COMPLETE EDITION", originalPrice: 999, salePrice: 149.85, discount: "-85%" },
  { title: "Hogwarts Legacy: Digital Deluxe Edition", originalPrice: 1395, salePrice: 348.75, discount: "-75%" },
  { title: "Assassin's Creed® The Ezio Collection", originalPrice: 799, salePrice: 239.70, discount: "-70%" },
  { title: "STAR WARS Jedi: La Orden caída™", originalPrice: 1195, salePrice: 119.50, discount: "-90%" },
  { title: "L.A. Noire", originalPrice: 999, salePrice: 499.50, discount: "-50%" },
  { title: "FARCRY 6", originalPrice: 1299, salePrice: 324.75, discount: "-75%" },
  { title: "Borderlands Legendary Collection", originalPrice: 1249.75, salePrice: 249.95, discount: "-80%" },
  { title: "LEGO® Los Increíbles", originalPrice: 1305.95, salePrice: 130.59, discount: "-90%" },
  { title: "Battlefield™ V Definitive Edition", originalPrice: 1199, salePrice: 119.90, discount: "-90%" },
  { title: "Assassin's Creed® III Remastered", originalPrice: 698, salePrice: 174.50, discount: "-75%" },
  { title: "Tales of Vesperia™: Definitive Edition", originalPrice: 1272.51, salePrice: 254.50, discount: "-80%" },
  { title: "Plants vs. Zombies™ Garden Warfare 2", originalPrice: 399, salePrice: 119.70, discount: "-70%" },
  { title: "LEGO® Batman™ 3: Más allá de Gotham Edición Deluxe", originalPrice: 469, salePrice: 93.80, discount: "-80%" },
  { title: "The Crew® 2", originalPrice: 599, salePrice: 119.80, discount: "-80%" },
  { title: "Titanfall™ 2", originalPrice: 439, salePrice: 87.80, discount: "-80%" },
  { title: "Stray", originalPrice: 529, salePrice: 264.50, discount: "-50%" },
  { title: "Resident Evil 5", originalPrice: 405.99, salePrice: 101.49, discount: "-75%" },
  { title: "Vampyr", originalPrice: 849, salePrice: 127.35, discount: "-85%" },
  { title: "NBA 2K26 x PGA TOUR 2K25 Bundle", originalPrice: 1999, salePrice: 499.75, discount: "-75%" },
  { title: "STAR WARS Jedi: La Orden caída™ Edición Deluxe", originalPrice: 1398, salePrice: 139.80, discount: "-90%" },
  { title: "Need for Speed™ Heat", originalPrice: 1300, salePrice: 65.00, discount: "-95%" },
  { title: "Assassin's Creed Valhalla", originalPrice: 1299, salePrice: 324.75, discount: "-75%" },
  { title: "LEGO® Worlds", originalPrice: 796, salePrice: 159.20, discount: "-80%" },
  { title: "Metro Redux Bundle", originalPrice: 399, salePrice: 59.85, discount: "-85%" },
  { title: "The Witcher 3: Wild Hunt – Complete Edition", originalPrice: 859, salePrice: 171.80, discount: "-80%" },
  { title: "Assassin's Creed Origins", originalPrice: 1202, salePrice: 180.30, discount: "-85%" },
  { title: "Halo Infinite", originalPrice: 1499, salePrice: 494.67, discount: "-67%" },
  { title: "CarX Drift Racing Online", originalPrice: 319, salePrice: 63.80, discount: "-80%" },
  { title: "LEGO® Star Wars™: La Saga De Skywalker Deluxe", originalPrice: 1199, salePrice: 239.80, discount: "-80%" },
  { title: "STAR WARS™ Battlefront™ II: Edición de Celebración", originalPrice: 838, salePrice: 209.50, discount: "-75%" },
  { title: "Resident Evil 6", originalPrice: 405.99, salePrice: 101.49, discount: "-75%" },
  { title: "Tom Clancy's The Division 2", originalPrice: 599, salePrice: 149.75, discount: "-75%" },
  { title: "TopSpin 2K25 Edición Digital Cross-Gen", originalPrice: 399, salePrice: 299.25, discount: "-25%" },
  { title: "STUFFED", originalPrice: 289, salePrice: 144.50, discount: "-50%" },
  { title: "Stranded Deep", originalPrice: 404.83, salePrice: 161.93, discount: "-60%" },
  { title: "Far Cry® 5", originalPrice: 1202, salePrice: 180.30, discount: "-85%" },
  { title: "Worms W.M.D", originalPrice: 449, salePrice: 89.80, discount: "-80%" },
  { title: "Slay The Spire", originalPrice: 439, salePrice: 109.75, discount: "-75%" },
  { title: "Sid Meier's Civilization VI", originalPrice: 599, salePrice: 119.80, discount: "-80%" },
  { title: "Doki Doki Literature Club Plus!", originalPrice: 312.03, salePrice: 234.02, discount: "-25%" },
  { title: "Far Cry 3 Classic Edition", originalPrice: 600, salePrice: 120.00, discount: "-80%" },
  { title: "DiRT Rally 2.0", originalPrice: 529, salePrice: 264.50, discount: "-50%" },
  { title: "FOR HONOR - Standard Edition", originalPrice: 599, salePrice: 89.85, discount: "-85%" },
  { title: "Riders Republic™", originalPrice: 799, salePrice: 119.85, discount: "-85%" },
  { title: "Plants vs. Zombies™ Garden Warfare 2: Edición Deluxe", originalPrice: 600, salePrice: 180.00, discount: "-70%" },
  { title: "One Piece: Burning Blood", originalPrice: 1272.51, salePrice: 127.25, discount: "-90%" },
  { title: "The Escapists 2 - Game of the Year Edition", originalPrice: 449, salePrice: 89.80, discount: "-80%" },
  { title: "PAW Patrol World - La Patrulla Canina", originalPrice: 709, salePrice: 212.70, discount: "-70%" },
  { title: "No Man's Sky", originalPrice: 1059, salePrice: 423.60, discount: "-60%" },
  { title: "The LEGO® NINJAGO® Movie Video Game", originalPrice: 894, salePrice: 89.40, discount: "-90%" },
  { title: "Battlefield 4™ Edición Premium", originalPrice: 838, salePrice: 83.80, discount: "-90%" },
  { title: "Minecraft Dungeons edición definitiva", originalPrice: 709, salePrice: 354.50, discount: "-50%" },
  { title: "PAYDAY 2: CRIMEWAVE EDITION", originalPrice: 249, salePrice: 49.80, discount: "-80%" },
  { title: "Dying Light Essentials Edition", originalPrice: 473, salePrice: 47.30, discount: "-90%" },
  { title: "Fobia - St. Dinfna Hotel", originalPrice: 529, salePrice: 52.90, discount: "-90%" },
  { title: "Edición de lujo de Los Vengadores de LEGO® Marvel", originalPrice: 796, salePrice: 159.20, discount: "-80%" },
  { title: "Battlefield 4", originalPrice: 399, salePrice: 39.90, discount: "-90%" },
  { title: "Battlefield™ V Standard Edition", originalPrice: 894, salePrice: 89.40, discount: "-90%" },
  { title: "Wreckfest", originalPrice: 529, salePrice: 158.70, discount: "-70%" },
  { title: "Far Cry® 4", originalPrice: 399, salePrice: 99.75, discount: "-75%" },
  { title: "Get Even", originalPrice: 662.35, salePrice: 99.35, discount: "-85%" },
  { title: "Assassin's Creed® Rogue Remastered", originalPrice: 600, salePrice: 180.00, discount: "-70%" },
  { title: "Sleeping Dogs™ Definitive Edition", originalPrice: 796, salePrice: 119.40, discount: "-85%" },
  { title: "Dragon Age™: Inquisition - Edición Juego del año", originalPrice: 729, salePrice: 182.25, discount: "-75%" },
  { title: "Subnautica: Below Zero", originalPrice: 698, salePrice: 174.50, discount: "-75%" },
  { title: "ONE PUNCH MAN: A HERO NOBODY KNOWS", originalPrice: 1391.99, salePrice: 139.19, discount: "-90%" },
  { title: "Paquete Yarny de Unravel", originalPrice: 635, salePrice: 127.00, discount: "-80%" },
  { title: "Paquete Deluxe de Need for Speed™", originalPrice: 547, salePrice: 109.40, discount: "-80%" },
  { title: "FAR CRY PRIMAL", originalPrice: 539, salePrice: 80.85, discount: "-85%" },
  { title: "MY HERO ONE'S JUSTICE 2", originalPrice: 679, salePrice: 169.75, discount: "-75%" },
  { title: "Need for Speed™ Hot Pursuit Remastered", originalPrice: 894, salePrice: 178.80, discount: "-80%" },
  { title: "MudRunner", originalPrice: 599, salePrice: 89.85, discount: "-85%" },
  { title: "Unravel", originalPrice: 399, salePrice: 59.85, discount: "-85%" },
  { title: "The Quarry para Xbox One", originalPrice: 1399, salePrice: 139.90, discount: "-90%" },
  { title: "Halo 5: Guardians", originalPrice: 549, salePrice: 137.25, discount: "-75%" },
  { title: "Edición del paquete Cross-gen de STAR WARS™ Jedi", originalPrice: 1499, salePrice: 299.80, discount: "-80%" },
  { title: "Mass Effect™: Andromeda – Deluxe Recruit Edition", originalPrice: 838, salePrice: 83.80, discount: "-90%" },
  { title: "Warhammer 40,000: Boltgun - Forges of Corruption Edition", originalPrice: 419, salePrice: 167.60, discount: "-60%" },
  { title: "Tiny Tina's Wonderlands: Chaotic Great Edition", originalPrice: 1829, salePrice: 274.35, discount: "-85%" },
  { title: "Overcooked! 2 - Gourmet Edition", originalPrice: 469, salePrice: 117.25, discount: "-75%" },
  { title: "HOT WHEELS UNLEASHED™ 2 - Turbocharged", originalPrice: 899, salePrice: 134.85, discount: "-85%" },
  { title: "Assassin's Creed Syndicate", originalPrice: 499, salePrice: 149.70, discount: "-70%" },
  { title: "Outer Wilds", originalPrice: 439, salePrice: 263.40, discount: "-40%" },
  { title: "WATCH_DOGS™", originalPrice: 399, salePrice: 79.80, discount: "-80%" },
  { title: "Fallout 4: Game of the Year Edition", originalPrice: 799, salePrice: 319.60, discount: "-60%" },
  { title: "UNO™", originalPrice: 150, salePrice: 60.00, discount: "-60%" },
  { title: "State of Decay 2: Juggernaut Edition", originalPrice: 799, salePrice: 199.75, discount: "-75%" },
  { title: "LEGO® Marvel Super Heroes 2 Edición Deluxe", originalPrice: 797.62, salePrice: 159.52, discount: "-80%" },
  { title: "Saints Row", originalPrice: 519, salePrice: 129.75, discount: "-75%" },
  { title: "Crash™ Team Racing Nitro-Fueled - Edición Nitros Oxide", originalPrice: 1300, salePrice: 455.00, discount: "-65%" },
  { title: "Age of Empires II: Definitive Edition", originalPrice: 349, salePrice: 122.15, discount: "-65%" },
  { title: "Teenage Mutant Ninja Turtles: Shredder's Revenge", originalPrice: 439, salePrice: 175.60, discount: "-60%" },
  { title: "Windbound", originalPrice: 399, salePrice: 39.90, discount: "-90%" },
  { title: "Tomb Raider Underworld", originalPrice: 479, salePrice: 71.85, discount: "-85%" },
  { title: "Unknown 9: Awakening", originalPrice: 379, salePrice: 189.50, discount: "-50%" },
  { title: "Overcooked! 2", originalPrice: 299.99, salePrice: 74.99, discount: "-75%" },
  { title: "Choo-Choo Charles", originalPrice: 349, salePrice: 69.80, discount: "-80%" },
  { title: "SnowRunner", originalPrice: 849, salePrice: 339.60, discount: "-60%" },
  { title: "RESIDENT EVIL 7 biohazard", originalPrice: 438.47, salePrice: 175.38, discount: "-60%" },
  { title: "Need for Speed™ Payback", originalPrice: 635, salePrice: 190.50, discount: "-70%" },
  { title: "We Love Katamari REROLL+ Royal Reverie", originalPrice: 539, salePrice: 134.75, discount: "-75%" },
  { title: "Plants vs. Zombies Garden Warfare", originalPrice: 399, salePrice: 119.70, discount: "-70%" },
  { title: "Atomic Heart", originalPrice: 1399, salePrice: 419.70, discount: "-70%" },
  { title: "Borderlands 3: Super Deluxe Edition", originalPrice: 1531, salePrice: 229.65, discount: "-85%" },
  { title: "Heavenly Bodies", originalPrice: 439, salePrice: 109.75, discount: "-75%" },
  { title: "Tiny Tina's Wonderlands: Next-Level Edition", originalPrice: 1422, salePrice: 142.20, discount: "-90%" },
  { title: "Lies of P", originalPrice: 1200, salePrice: 600.00, discount: "-50%" },
  { title: "STAR WARS™: Squadrons", originalPrice: 894, salePrice: 89.40, discount: "-90%" },
  { title: "KINGDOM HEARTS - HD 1.5+2.5 ReMIX -", originalPrice: 969, salePrice: 387.60, discount: "-60%" },
  { title: "GreedFall", originalPrice: 809, salePrice: 121.35, discount: "-85%" },
  { title: "Dying Light 2: Stay Human - Reloaded Edition", originalPrice: 1059, salePrice: 211.80, discount: "-80%" },
  { title: "Bulletstorm: Full Clip Edition", originalPrice: 430.35, salePrice: 43.03, discount: "-90%" },
  { title: "The Witcher 3: Wild Hunt", originalPrice: 350, salePrice: 70.00, discount: "-80%" },
  { title: "The Wolf Among Us", originalPrice: 157, salePrice: 78.50, discount: "-50%" },
  { title: "Edición Ballpark de Super Mega Baseball™ 4", originalPrice: 1399, salePrice: 139.90, discount: "-90%" },
  { title: "Call of Cthulhu", originalPrice: 399, salePrice: 59.85, discount: "-85%" },
  { title: "FOR HONOR - Gold Edition", originalPrice: 1199, salePrice: 179.85, discount: "-85%" },
  { title: "LEGO® Star Wars™: El despertar de la fuerza Edición Deluxe", originalPrice: 600, salePrice: 120.00, discount: "-80%" },
  { title: "Tom Clancy's The Division - Definitive Edition", originalPrice: 999, salePrice: 199.80, discount: "-80%" },
  { title: "Watch Dogs®: Legion", originalPrice: 1229, salePrice: 184.35, discount: "-85%" },
  { title: "HOT WHEELS UNLEASHED™ 2 - Turbocharged - Legendary Edition", originalPrice: 1649, salePrice: 247.35, discount: "-85%" },
  { title: "Battlefield™ 2042 para Xbox One y Xbox Series X|S", originalPrice: 1599, salePrice: 159.90, discount: "-90%" },
  { title: "Rubber Bandits", originalPrice: 239, salePrice: 47.80, discount: "-80%" },
  { title: "What Remains of Edith Finch", originalPrice: 249, salePrice: 62.25, discount: "-75%" },
  { title: "Make Way", originalPrice: 249, salePrice: 62.25, discount: "-75%" },
  { title: "Plants vs. Zombies™: La Batalla de Neighborville", originalPrice: 369, salePrice: 147.60, discount: "-60%" },
  { title: "DREDGE: Complete Edition", originalPrice: 499.99, salePrice: 249.99, discount: "-50%" },
  { title: "Lote: South Park™: La Vara de la Verdad™ + Retaguardia en Peligro™", originalPrice: 1199, salePrice: 179.85, discount: "-85%" },
  { title: "Sea of Thieves: 2026 Premium Edition", originalPrice: 1399, salePrice: 489.65, discount: "-65%" },
  { title: "Prime Evil Collection de Diablo®", originalPrice: 1199, salePrice: 395.67, discount: "-67%" },
  { title: "Resident Evil", originalPrice: 381.63, salePrice: 95.40, discount: "-75%" },
  { title: "Resident Evil 0", originalPrice: 381.63, salePrice: 95.40, discount: "-75%" },
  { title: "RESIDENT EVIL 2", originalPrice: 866.51, salePrice: 173.30, discount: "-80%" },
  { title: "The Escapists 2", originalPrice: 249, salePrice: 62.25, discount: "-75%" },
  { title: "Little Kitty, Big City", originalPrice: 439, salePrice: 263.40, discount: "-40%" },
  { title: "Core Keeper", originalPrice: 349, salePrice: 209.40, discount: "-40%" },
  { title: "Assassin's Creed® Mirage", originalPrice: 999, salePrice: 399.60, discount: "-60%" },
  { title: "STAR WARS Jedi: Survivor™ para Xbox One", originalPrice: 899, salePrice: 224.75, discount: "-75%" },
  { title: "XCOM® 2 Collection", originalPrice: 799, salePrice: 199.75, discount: "-75%" },
  { title: "Worms Battlegrounds", originalPrice: 329, salePrice: 65.80, discount: "-80%" },
  { title: "Edición Deluxe de Riders Republic", originalPrice: 1199, salePrice: 179.85, discount: "-85%" },
  { title: "Need for Speed™", originalPrice: 439, salePrice: 131.70, discount: "-70%" },
  { title: "Tiny Tina's Wonderlands", originalPrice: 1219, salePrice: 121.90, discount: "-90%" },
  { title: "Kerbal Space Program Enhanced Edition", originalPrice: 750, salePrice: 150.00, discount: "-80%" },
  { title: "Tales of Graces f Remastered", originalPrice: 789, salePrice: 394.50, discount: "-50%" },
  { title: "A Little to the Left", originalPrice: 249, salePrice: 99.60, discount: "-60%" },
  { title: "PAQUETE TRIPLE DE EA STAR WARS™", originalPrice: 1797, salePrice: 359.40, discount: "-80%" },
  { title: "Kona II: Brume", originalPrice: 529, salePrice: 105.80, discount: "-80%" },
  { title: "DiRT Rally 2.0 - Game of the Year Edition", originalPrice: 879, salePrice: 351.60, discount: "-60%" },
  { title: "Mirror's Edge™ Catalyst", originalPrice: 399, salePrice: 79.80, discount: "-80%" },
  { title: "Prince of Persia™: The Lost Crown - Complete Edition", originalPrice: 799, salePrice: 239.70, discount: "-70%" },
  { title: "DIRT 5 Year One Edition", originalPrice: 1589, salePrice: 238.35, discount: "-85%" },
  { title: "Danganronpa: Trigger Happy Havoc Anniversary Edition", originalPrice: 269, salePrice: 134.50, discount: "-50%" },
  { title: "FINAL FANTASY VII", originalPrice: 329, salePrice: 131.60, discount: "-60%" },
  { title: "Age of Empires IV: Edición de Aniversario", originalPrice: 427.99, salePrice: 213.99, discount: "-50%" },
  { title: "Borderlands: Game of the Year Edition", originalPrice: 579, salePrice: 191.07, discount: "-67%" },
  { title: "The Lord of the Rings: Gollum™", originalPrice: 529, salePrice: 52.90, discount: "-90%" },
  { title: "Dolmen", originalPrice: 339, salePrice: 50.85, discount: "-85%" },
  { title: "Evil West", originalPrice: 1099, salePrice: 219.80, discount: "-80%" },
  { title: "The Walking Dead: The Telltale Definitive Series", originalPrice: 1019.63, salePrice: 254.90, discount: "-75%" },
  { title: "Morbid: The Lords of Ire", originalPrice: 529, salePrice: 105.80, discount: "-80%" },
  { title: "Tom Clancy's Rainbow Six® Extraction", originalPrice: 799, salePrice: 199.75, discount: "-75%" },
  { title: "Deus Ex: Mankind Divided™", originalPrice: 599, salePrice: 89.85, discount: "-85%" },
  { title: "Yakuza Kiwami", originalPrice: 349, salePrice: 209.40, discount: "-40%" },
  { title: "Devil May Cry 5 + Vergil", originalPrice: 689.03, salePrice: 103.35, discount: "-85%" },
  { title: "NieR:Automata™ BECOME AS GODS Edition", originalPrice: 761, salePrice: 304.40, discount: "-60%" },
  { title: "Life is Strange 2: Temporada completa", originalPrice: 600, salePrice: 120.00, discount: "-80%" },
  { title: "Crash™ Team Racing Nitro-Fueled", originalPrice: 999, salePrice: 349.65, discount: "-65%" },
  { title: "Ori and the Will of the Wisps", originalPrice: 799, salePrice: 199.75, discount: "-75%" },
  { title: "OUTRIDERS", originalPrice: 350, salePrice: 140.00, discount: "-60%" },
  { title: "DIRT 5", originalPrice: 1239, salePrice: 309.75, discount: "-75%" },
  { title: "The Escapists", originalPrice: 249, salePrice: 49.80, discount: "-80%" },
  { title: "Immortals Fenyx Rising™", originalPrice: 799, salePrice: 159.80, discount: "-80%" },
  { title: "Prey", originalPrice: 599, salePrice: 119.80, discount: "-80%" },
  { title: "Aliens: Dark Descent", originalPrice: 719, salePrice: 215.70, discount: "-70%" },
  { title: "Overcooked: Gourmet Edition", originalPrice: 321, salePrice: 64.20, discount: "-80%" },
  { title: "Just Cause 4: Reloaded", originalPrice: 944, salePrice: 141.60, discount: "-85%" },
  { title: "Kerbal Space Program Enhanced Edition Complete", originalPrice: 1098.90, salePrice: 219.78, discount: "-80%" },
  { title: "Streets of Rage 4", originalPrice: 439, salePrice: 109.75, discount: "-75%" },
  { title: "Expeditions: A MudRunner Game", originalPrice: 859, salePrice: 343.60, discount: "-60%" },
  { title: "Gunfire Reborn", originalPrice: 399, salePrice: 199.50, discount: "-50%" },
  { title: "WRC 10 FIA World Rally Championship", originalPrice: 709, salePrice: 141.80, discount: "-80%" },
  { title: "South Park™: La Vara de la Verdad™", originalPrice: 600, salePrice: 120.00, discount: "-80%" },
  { title: "Hotel Renovator", originalPrice: 429, salePrice: 128.70, discount: "-70%" },
  { title: "Sonic Origins", originalPrice: 509, salePrice: 152.70, discount: "-70%" },
  { title: "Mass Effect™: Andromeda – Standard Recruit Edition", originalPrice: 369, salePrice: 55.35, discount: "-85%" },
  { title: "Edición de lujo de Resident Evil Revelations 2", originalPrice: 345, salePrice: 86.25, discount: "-75%" },
  { title: "Devil May Cry HD Collection", originalPrice: 662.35, salePrice: 99.35, discount: "-85%" },
  { title: "Chants of Sennaar", originalPrice: 349, salePrice: 174.50, discount: "-50%" },
  { title: "Bugsnax", originalPrice: 509.23, salePrice: 168.04, discount: "-67%" },
  { title: "Super Mega Baseball™ 4", originalPrice: 1199, salePrice: 119.90, discount: "-90%" },
  { title: "DYSMANTLE", originalPrice: 349, salePrice: 122.15, discount: "-65%" },
  { title: "FINAL FANTASY IX", originalPrice: 399, salePrice: 119.70, discount: "-70%" },
  { title: "Yu-Gi-Oh! Legacy of the Duelist", originalPrice: 249, salePrice: 62.25, discount: "-75%" },
  { title: "RESIDENT EVIL 3", originalPrice: 945.40, salePrice: 189.08, discount: "-80%" },
  { title: "WRC Generations Fully Loaded Edition", originalPrice: 879, salePrice: 175.80, discount: "-80%" },
  { title: "FINAL FANTASY VIII Remastered", originalPrice: 379, salePrice: 151.60, discount: "-60%" },
  { title: "Crysis Remastered Trilogy", originalPrice: 879, salePrice: 439.50, discount: "-50%" },
  { title: "Teenage Mutant Ninja Turtles: The Cowabunga Collection", originalPrice: 999, salePrice: 399.60, discount: "-60%" },
  { title: "Prince of Persia The Lost Crown", originalPrice: 599, salePrice: 179.70, discount: "-70%" },
  { title: "Dead Rising 3: Apocalypse Edition", originalPrice: 809.67, salePrice: 161.93, discount: "-80%" },
  { title: "The Council - Complete Season", originalPrice: 299, salePrice: 74.75, discount: "-75%" },
  { title: "SD GUNDAM BATTLE ALLIANCE", originalPrice: 1200, salePrice: 360.00, discount: "-70%" },
  { title: "Trackmania® Turbo", originalPrice: 649, salePrice: 129.80, discount: "-80%" },
  { title: "Call of the Wild: The Angler™", originalPrice: 529, salePrice: 105.80, discount: "-80%" },
  { title: "Ancestors: The Humankind Odyssey", originalPrice: 768, salePrice: 153.60, discount: "-80%" },
  { title: "Battlefield™ 2042 para Xbox One", originalPrice: 1399, salePrice: 139.90, discount: "-90%" },
  { title: "Harry Potter: Campeones de quidditch Edición Deluxe", originalPrice: 499, salePrice: 74.85, discount: "-85%" },
  { title: "Aliens: Fireteam Elite", originalPrice: 609, salePrice: 152.25, discount: "-75%" },
  { title: "Tom Clancy's The Division", originalPrice: 599, salePrice: 119.80, discount: "-80%" },
  { title: "Dreamfall Chapters", originalPrice: 399, salePrice: 59.85, discount: "-85%" },
  { title: "FINAL FANTASY X/X-2 HD Remaster", originalPrice: 1097, salePrice: 438.80, discount: "-60%" },
  { title: "Under The Waves", originalPrice: 529, salePrice: 105.80, discount: "-80%" },
  { title: "My Time at Portia Deluxe Edition", originalPrice: 399, salePrice: 99.75, discount: "-75%" },
  { title: "DayZ", originalPrice: 969, salePrice: 436.05, discount: "-55%" },
  { title: "Slime Rancher Rainbow Bundle", originalPrice: 799, salePrice: 399.50, discount: "-50%" },
  { title: "Plants vs. Zombies™: La Batalla de Neighborville Deluxe Edition", originalPrice: 549, salePrice: 164.70, discount: "-70%" },
  { title: "World War Z", originalPrice: 529, salePrice: 174.57, discount: "-67%" },
  { title: "GRID Legends: Deluxe Edition", originalPrice: 1799, salePrice: 359.80, discount: "-80%" },
  { title: "Police Simulator: Patrol Officers", originalPrice: 529, salePrice: 174.57, discount: "-67%" },
  { title: "Zoo Tycoon: Ultimate Animal Collection", originalPrice: 499, salePrice: 164.67, discount: "-67%" },
  { title: "Fable Anniversary", originalPrice: 599, salePrice: 197.67, discount: "-67%" },
  { title: "Halo Wars: Definitive Edition", originalPrice: 185, salePrice: 46.25, discount: "-75%" },
  { title: "Need for Speed™ Payback - Deluxe Edition", originalPrice: 838, salePrice: 251.40, discount: "-70%" },
  { title: "Resident Evil Village", originalPrice: 795, salePrice: 198.75, discount: "-75%" },
  { title: "The Texas Chain Saw Massacre - Content Pass Edition", originalPrice: 469, salePrice: 234.50, discount: "-50%" },
  { title: "Devil May Cry HD Collection & 4SE Bundle", originalPrice: 996.43, salePrice: 199.28, discount: "-80%" },
  { title: "Disney Epic Mickey: Rebrushed", originalPrice: 709, salePrice: 283.60, discount: "-60%" },
  { title: "Construction Simulator", originalPrice: 529, salePrice: 174.57, discount: "-67%" },
  { title: "Assassin's Creed Chronicles – Trilogy", originalPrice: 399, salePrice: 119.70, discount: "-70%" },
  { title: "GigaBash", originalPrice: 519, salePrice: 181.65, discount: "-65%" },
  { title: "OUTRIDERS COMPLETE EDITION", originalPrice: 500, salePrice: 250.00, discount: "-50%" },
  { title: "Just Shapes & Beats", originalPrice: 429, salePrice: 257.40, discount: "-40%" },
  { title: "Unpacking", originalPrice: 349, salePrice: 139.60, discount: "-60%" },
  { title: "ARMORED CORE™ VI FIRES OF RUBICON™", originalPrice: 1169, salePrice: 584.50, discount: "-50%" },
  { title: "FINAL FANTASY XV ROYAL EDITION", originalPrice: 669, salePrice: 267.60, discount: "-60%" },
  { title: "That Time I Got Reincarnated as a Slime ISEKAI Chronicles", originalPrice: 849, salePrice: 254.70, discount: "-70%" },
  { title: "Afterimage", originalPrice: 233.99, salePrice: 23.39, discount: "-90%" },
  { title: "Road Rage", originalPrice: 349, salePrice: 34.90, discount: "-90%" },
  { title: "Golf With Your Friends - Starter Edition", originalPrice: 449, salePrice: 44.90, discount: "-90%" },
  { title: "LEGO® Party!", originalPrice: 599.99, salePrice: 419.99, discount: "-30%" },
  { title: "La Tierra Media™: Sombras de Mordor™ - Edición Game of the Year", originalPrice: 901, salePrice: 225.25, discount: "-75%" },
  { title: "Sid Meier's Civilization® VII", originalPrice: 1190, salePrice: 595.00, discount: "-50%" },
  { title: "KINGDOM HEARTS Ⅲ", originalPrice: 1125, salePrice: 450.00, discount: "-60%" },
  { title: "ULTIMATE MARVEL VS. CAPCOM 3", originalPrice: 752.83, salePrice: 150.56, discount: "-80%" },
  { title: "BattleBlock Theater", originalPrice: 199, salePrice: 49.75, discount: "-75%" },
  { title: "Extinction: Deluxe Edition", originalPrice: 709, salePrice: 70.90, discount: "-90%" },
  { title: "The LEGO® Movie 2 - Videogame", originalPrice: 894, salePrice: 134.10, discount: "-85%" },
  { title: "Need for Speed™ Rivals", originalPrice: 399, salePrice: 119.70, discount: "-70%" },
  { title: "The Crew® 2 Special Edition", originalPrice: 799, salePrice: 159.80, discount: "-80%" },
  { title: "RUSH: A Disney • PIXAR Adventure", originalPrice: 499, salePrice: 164.67, discount: "-67%" },
  { title: "Monster Jam™ Showdown - Big Air Edition", originalPrice: 1299, salePrice: 259.80, discount: "-80%" },
  { title: "Monster Jam™ Showdown", originalPrice: 899, salePrice: 179.80, discount: "-80%" },
  { title: "Paw Patrol La poderosa patrulla CANINA salva Bahía Aventura.", originalPrice: 529, salePrice: 211.60, discount: "-60%" },
  { title: "60 Seconds! Reatomized", originalPrice: 177, salePrice: 88.50, discount: "-50%" },
  { title: "Sclash", originalPrice: 177, salePrice: 26.55, discount: "-85%" },
  { title: "Ikaruga", originalPrice: 135, salePrice: 44.55, discount: "-67%" },
  { title: "Thief", originalPrice: 399, salePrice: 59.85, discount: "-85%" },
  { title: "Duke Nukem 3D: 20th Anniversary World Tour", originalPrice: 288.83, salePrice: 28.88, discount: "-90%" },
  { title: "Kona", originalPrice: 199, salePrice: 29.85, discount: "-85%" },
  { title: "Tyler: Model 005", originalPrice: 249, salePrice: 24.90, discount: "-90%" },
  { title: "Bound by Flame", originalPrice: 199, salePrice: 19.90, discount: "-90%" },
  { title: "Relicta", originalPrice: 229, salePrice: 22.90, discount: "-90%" },
  { title: "Raging Justice", originalPrice: 199, salePrice: 29.85, discount: "-85%" },
  { title: "Necropolis", originalPrice: 597.39, salePrice: 89.60, discount: "-85%" },
  { title: "Alekhine's Gun", originalPrice: 349, salePrice: 34.90, discount: "-90%" },
  { title: "Dead Island Definitive Edition", originalPrice: 249, salePrice: 37.35, discount: "-85%" },
  { title: "Dead Island: Riptide Definitive Edition", originalPrice: 249, salePrice: 37.35, discount: "-85%" },
  { title: "Faery: Legends of Avalon", originalPrice: 139, salePrice: 20.85, discount: "-85%" },
  { title: "Mars: War Logs", originalPrice: 99, salePrice: 19.80, discount: "-80%" },
  { title: "RAW - Realms of Ancient War", originalPrice: 99, salePrice: 19.80, discount: "-80%" },
  { title: "Lichdom: Battlemage", originalPrice: 177, salePrice: 26.55, discount: "-85%" },
  { title: "Star Wars Republic Commando", originalPrice: 199, salePrice: 69.65, discount: "-65%" },
  { title: "Lote Prototype® Biohazard", originalPrice: 796, salePrice: 238.80, discount: "-70%" },
  { title: "Hora de aventuras: Piratas del Enchiridión", originalPrice: 439, salePrice: 131.70, discount: "-70%" },
  { title: "Edición de lujo de Dragon Age™: Inquisition", originalPrice: 369, salePrice: 92.25, discount: "-75%" },
  { title: "Just Cause 3", originalPrice: 378, salePrice: 56.70, discount: "-85%" },
  { title: "Just Cause 3: XXL Edition", originalPrice: 571, salePrice: 85.65, discount: "-85%" },
  { title: "Danganronpa 2: Goodbye Despair Anniversary Edition", originalPrice: 269, salePrice: 134.50, discount: "-50%" },
  { title: "Ice Age Una Aventura de Bellotas", originalPrice: 529, salePrice: 158.70, discount: "-70%" },
  { title: "Ravenswatch - Legendary Edition", originalPrice: 709, salePrice: 212.70, discount: "-70%" },
  { title: "Chorus", originalPrice: 422, salePrice: 84.40, discount: "-80%" },
  { title: "SIGNALIS", originalPrice: 399, salePrice: 279.30, discount: "-30%" },
  { title: "STAR WARS Battlefront", originalPrice: 199, salePrice: 99.50, discount: "-50%" },
  { title: "Tony Hawk's™ Pro Skater™ 3 + 4 - Edición Digital Deluxe", originalPrice: 1399, salePrice: 699.50, discount: "-50%" },
  { title: "Grounded", originalPrice: 1099, salePrice: 549.50, discount: "-50%" },
  { title: "The Jackbox Party Pack 7", originalPrice: 529, salePrice: 343.85, discount: "-35%" },
  { title: "Risk of Rain", originalPrice: 173.99, salePrice: 43.49, discount: "-75%" },
  { title: "Mighty No. 9", originalPrice: 249, salePrice: 37.35, discount: "-85%" },
  { title: "Space Invaders: IG", originalPrice: 135, salePrice: 20.25, discount: "-85%" },
  { title: "Fantasy Dash", originalPrice: 53, salePrice: 17.00, discount: "-68%" },
  { title: "Escape Dead Island", originalPrice: 299, salePrice: 45.00, discount: "-85%" },
  { title: "The Fissure", originalPrice: 75, salePrice: 60.00, discount: "-20%" },
  { title: "Blacksmith Forger", originalPrice: 89, salePrice: 17.80, discount: "-80%" },
  { title: "Sokocat: Castaway", originalPrice: 89, salePrice: 71.20, discount: "-20%" },
  { title: "Quest Arrest", originalPrice: 89, salePrice: 71.20, discount: "-20%" },
  { title: "Cuboy Adventure", originalPrice: 89, salePrice: 71.20, discount: "-20%" },
  { title: "Gas Ratio", originalPrice: 89, salePrice: 48.95, discount: "-45%" },
  { title: "In Fair Spirits", originalPrice: 157, salePrice: 125.60, discount: "-20%" },
  { title: "Minami Lane", originalPrice: 69, salePrice: 48.30, discount: "-30%" },
  { title: "Car Driving School Simulator", originalPrice: 209, salePrice: 146.30, discount: "-30%" },
  { title: "Pawbay: Cat Chaos", originalPrice: 379, salePrice: 303.20, discount: "-20%" },
  { title: "SOS OPS!", originalPrice: 177, salePrice: 88.50, discount: "-50%" },
  { title: "Spiritfall", originalPrice: 229, salePrice: 75.57, discount: "-67%" },
  { title: "Slay the Princess - The Pristine Cut", originalPrice: 319, salePrice: 223.30, discount: "-30%" },
  { title: "Diablo II: Resurrected – Infernal Edition", originalPrice: 749, salePrice: 524.30, discount: "-30%" },
  { title: "TRIVIAL PURSUIT Live! 2", originalPrice: 399, salePrice: 199.50, discount: "-50%" },
  { title: "S.T.A.L.K.E.R.: Trilogía Legends of the Zone", originalPrice: 639, salePrice: 428.13, discount: "-33%" },
  { title: "Heart of Darkness Collection", originalPrice: 818, salePrice: 548.06, discount: "-33%" },
  { title: "The Oregon Trail", originalPrice: 719, salePrice: 237.27, discount: "-67%" },
  { title: "NAMCO MUSEUM® ARCHIVES Vol 1", originalPrice: 439.63, salePrice: 109.90, discount: "-75%" },
  { title: "NAMCO MUSEUM® ARCHIVES Vol 2", originalPrice: 439.63, salePrice: 109.90, discount: "-75%" },
  { title: "11-11 Memories Retold", originalPrice: 695.99, salePrice: 104.39, discount: "-85%" },
  { title: "Resident Evil Village", originalPrice: 795, salePrice: 198.75, discount: "-75%" },
  { title: "FINAL FANTASY VII REMAKE INTERGRADE Digital Deluxe Edition", originalPrice: 1200, salePrice: 420.00, discount: "-65%" },
  { title: "Peppa Pig: Un mundo de aventuras", originalPrice: 709, salePrice: 212.70, discount: "-70%" },
  { title: "DEEEER Simulator: Tu juego de ciervos cotidiano estándar", originalPrice: 349, salePrice: 209.40, discount: "-40%" },
  { title: "Godfall: Edición Ultimate", originalPrice: 899, salePrice: 314.65, discount: "-65%" },
  { title: "Stray", originalPrice: 529, salePrice: 264.50, discount: "-50%" },
  { title: "ARCADE GAME SERIES: PAC-MAN", originalPrice: 83.28, salePrice: 41.64, discount: "-50%" },
  { title: "ARCADE GAME SERIES: Ms. PAC-MAN", originalPrice: 83.28, salePrice: 41.64, discount: "-50%" },
  { title: "ARCADE GAME SERIES: GALAGA", originalPrice: 83.28, salePrice: 41.64, discount: "-50%" },
  { title: "Destiny - The Collection", originalPrice: 325, salePrice: 32.50, discount: "-90%" },
  { title: "Star Wars Battlefront II (Classic)", originalPrice: 199, salePrice: 99.50, discount: "-50%" },
  { title: "Oblivion", originalPrice: 199, salePrice: 59.70, discount: "-70%" },
  { title: "The Walking Dead: The Complete First Season", originalPrice: 157, salePrice: 39.25, discount: "-75%" },
  { title: "Rugby 25", originalPrice: 1059, salePrice: 423.60, discount: "-60%" },
  { title: "PAW Patrol™ Rescue Wheels™: Championship", originalPrice: 709, salePrice: 354.50, discount: "-50%" },
  { title: "My Little Pony: Misterio en los Altos de Céfiro", originalPrice: 709, salePrice: 212.70, discount: "-70%" },
  { title: "eFootball™: Mourinho Edition 2026", originalPrice: 94, salePrice: 75.20, discount: "-20%" },
  { title: "World of Outlaws: Dirt Racing 24 Gold Edition", originalPrice: 709, salePrice: 425.40, discount: "-40%" },
  { title: "World of Outlaws: Dirt Racing 24", originalPrice: 529, salePrice: 317.40, discount: "-40%" },
  { title: "Paquete Hazelight", originalPrice: 1399, salePrice: 419.70, discount: "-70%" },
  { title: "The Jackbox Party Pack 11", originalPrice: 334.99, salePrice: 251.24, discount: "-25%" },
  { title: "Tales of ARISE - Beyond the Dawn Edition", originalPrice: 899, salePrice: 629.30, discount: "-30%" },
  { title: "TIEBREAK+ Ace Edition", originalPrice: 1059, salePrice: 317.70, discount: "-70%" },
  { title: "Forza Horizon 5: Edición Estándar", originalPrice: 1599, salePrice: 799.50, discount: "-50%" },
  { title: "ELDEN RING NIGHTREIGN", originalPrice: 829, salePrice: 621.75, discount: "-25%" },
  { title: "ELDEN RING NIGHTREIGN Deluxe Edition", originalPrice: 1139, salePrice: 911.20, discount: "-20%" },
  { title: "Disney Dreamlight Valley - Edición Honeyglow Woods", originalPrice: 925, salePrice: 832.50, discount: "-10%" },
  { title: "Sekiro™: Shadows Die Twice - Edición Juego del Año", originalPrice: 1300, salePrice: 650.00, discount: "-50%" },
  { title: "Call of Duty®: Black Ops 6 - Lote Multigeneración", originalPrice: 1399, salePrice: 559.60, discount: "-60%" },
  { title: "Call of Duty®: Black Ops Cold War - Lote Multigeneración", originalPrice: 1799, salePrice: 593.67, discount: "-67%" },
  { title: "Call of Duty®: Black Ops 7 - Lote Multigeneración", originalPrice: 1499, salePrice: 749.50, discount: "-50%" },
  { title: "Call of Duty®: Modern Warfare® II - Lote multigeneración", originalPrice: 1399, salePrice: 419.70, discount: "-70%" },
  { title: "Call of Duty®: Modern Warfare® III - Lote Multigeneración", originalPrice: 1399, salePrice: 559.60, discount: "-60%" },
  { title: "Call of Duty®: Modern Warfare® - Edición Estándar Digital", originalPrice: 1300, salePrice: 325.00, discount: "-75%" },
  { title: "Call of Duty®: Modern Warfare® Remastered", originalPrice: 894, salePrice: 447.00, discount: "-50%" },
  { title: "Gold Edition de Call of Duty®: Advanced Warfare", originalPrice: 999, salePrice: 249.75, discount: "-75%" },
  { title: "Call of Duty®: WWII - Gold Edition", originalPrice: 1300, salePrice: 429.00, discount: "-67%" },
  { title: "Call of Duty®: Black Ops 4", originalPrice: 1300, salePrice: 429.00, discount: "-67%" },
  { title: "Call of Duty®: Black Ops Cold War", originalPrice: 1599, salePrice: 559.65, discount: "-65%" },
  { title: "Crash Bandicoot™ 4: It's About Time", originalPrice: 1594, salePrice: 526.02, discount: "-67%" },
  { title: "DayZ Cool Edition", originalPrice: 1239, salePrice: 743.40, discount: "-40%" },
  { title: "Kingdom Come: Deliverance – Saga Bundle", originalPrice: 1799, salePrice: 719.60, discount: "-60%" },
  { title: "Forza Horizon 5 Premium Edition", originalPrice: 2599, salePrice: 1299.50, discount: "-50%" },
  { title: "FINAL FANTASY VII REBIRTH Digital Deluxe Edition", originalPrice: 1200, salePrice: 720.00, discount: "-40%" },
  { title: "Mortal Kombat: Lote Dios Antiguo", originalPrice: 1299, salePrice: 519.60, discount: "-60%" },
  { title: "Call of Duty®: Black Ops 4 - Digital Deluxe", originalPrice: 2000, salePrice: 800.00, discount: "-60%" },
  { title: "Call of Duty®: Black Ops III - Zombies Deluxe", originalPrice: 2168, salePrice: 867.20, discount: "-60%" },
  { title: "Borderlands Collection: Caja de Pandora", originalPrice: 2799, salePrice: 699.75, discount: "-75%" },
  { title: "Sid Meier's Civilization® VII Edición Colonos", originalPrice: 1990, salePrice: 995.00, discount: "-50%" },
  { title: "Call of Duty®: WWII - Edición Digital Deluxe", originalPrice: 2168, salePrice: 867.20, discount: "-60%" },
  { title: "The Elder Scrolls Online: Deluxe Edition", originalPrice: 1199, salePrice: 599.50, discount: "-50%" },
  { title: "Edición Prémium de Riders Republic", originalPrice: 1999, salePrice: 599.70, discount: "-70%" },
  { title: "Battlefield™ 2042 Elite Edition Oro para Xbox One y Xbox Series X|S", originalPrice: 2299, salePrice: 229.90, discount: "-90%" },
  { title: "Tom Clancy's The Division 2 - Ultimate Edition", originalPrice: 1399, salePrice: 559.60, discount: "-60%" },
  { title: "FAR CRY 4 GOLD EDITION", originalPrice: 649, salePrice: 162.25, discount: "-75%" },
  { title: "Call of Duty®: Ghosts", originalPrice: 999, salePrice: 249.75, discount: "-75%" },
  { title: "Call of Duty®: Infinite Warfare - Ed. Lanzamiento", originalPrice: 1195, salePrice: 394.35, discount: "-67%" }
];

// ==================== FILTERS ====================

// Xbox 360 / Original Xbox exclusive titles to exclude (not remastered for Xbox One)
const xbox360Titles = [
  'Call of Duty®: Black Ops II',
  'Call of Duty®: Black Ops',
  'Call of Duty®: World at War',
  'Call of Duty® 4: Modern Warfare®',
  'Call of Duty®: Modern Warfare® 2', // Original 360 version
  'Call of Duty®: Modern Warfare® 3', // Original 360 version  
  'Call of Duty® 3',
  'Call of Duty® 2',
  'Grand Theft Auto IV',
  'Fable II',
  'Fable III',
  'Fable Anniversary',
  'Midway Arcade Origins',
  'FIGHT NIGHT CHAMPION',
  'F.E.A.R. 2',
  'STREET FIGHTER IV',
  'Mercenaries: Playground of Destruction',
  'Fuzion Frenzy®',
  'Red Faction II',
  'Red Faction: Armageddon',
  'Splosion Man',
  'BattleBlock Theater',
  'Oblivion',
  'Star Wars Battlefront II (Classic)',
  'STAR WARS Battlefront',
  'Destiny - The Collection',
  'DEUS EX: HUMAN REVOLUTION',
  'Dragon Age: Origins',
  'Dragon Age™ 2',
  'Tom Clancy\'s Splinter Cell: Blacklist',
  'Tom Clancy\'s Splinter Cell® Conviction™',
  'Tom Clancy\'s Splinter Cell: Chaos Theory',
  'Tom Clancy\'s Rainbow Six Vegas 2',
  'STAR WARS™ - Knights of the Old Republic™',
  'Star Wars KOTOR II',
  'Star Wars: The Force Unleashed',
  'Star Wars: The Force Unleashed II',
  'El Poder de la Fuerza',
  'Star Wars Republic Commando',
  'STAR WARS Jedi Knight: Jedi Academy',
  'LEGO® Batman™ 2',
  'LEGO Star Wars: TCS',
  'LEGO Star Wars III',
  'LEGO Indiana Jones: La trilogía original',
  'LEGO® Indiana Jones™ 2',
  'LEGO Piratas del Caribe El Videojuego',
  'LEGO® The Hobbit™',
  'Cars 2 El Videojuego',
  'Far Cry® 2',
  'Far Cry 3',
  'RESIDENT EVIL CODE: Veronica X',
  'resident evil 4 (2005)',
  'Tomb Raider Underworld',
  'Tomb Raider: Anniv.',
  'Tomb Raider:Legend',
  'ARCADE GAME SERIES: PAC-MAN',
  'ARCADE GAME SERIES: Ms. PAC-MAN',
  'ARCADE GAME SERIES: GALAGA',
  'ARCADE GAME SERIES 3-in-1 Pack',
  'The Walking Dead: The Complete First Season',
  'Escape Dead Island',
  'Ikaruga',
  'Space Invaders: IG',
  'Duke Nukem 3D: 20th Anniversary World Tour',
  'Faery: Legends of Avalon',
  'Mars: War Logs',
  'RAW - Realms of Ancient War',
  'Splosion Man',
  'Risk of Rain',
  'The Fissure',
  'The Wolf Among Us',
  'Mighty No. 9',
  'Midway Arcade Origins',
  'Dead Island Definitive Edition',
  'Dead Island: Riptide Definitive Edition'
];

// DLC / Complementos / Add-ons / Currency to exclude
const dlcKeywords = [
  'moneda', 'monedas', 'stubs', 'points', 'coins', 'credits', 'créditos',
  'virtual currency', 'token', 'puntos', 'gems', 'gemas', 'bucks', 'v-bucks'
];

function isDLC(title) {
  const lower = title.toLowerCase();
  return dlcKeywords.some(kw => lower.includes(kw));
}

function isXbox360(title) {
  return xbox360Titles.some(x360 => {
    return title.toLowerCase().includes(x360.toLowerCase()) && 
           title.toLowerCase() === x360.toLowerCase();
  }) || xbox360Titles.includes(title);
}

// Popularity score - higher = more popular/well-known
function getPopularityScore(title) {
  const t = title.toLowerCase();
  
  // Tier S - Mega franchises, everyone knows these
  if (t.includes('red dead redemption 2')) return 1000;
  if (t.includes('cyberpunk 2077')) return 995;
  if (t.includes('grand theft auto')) return 990;
  if (t.includes('halo infinite')) return 985;
  if (t.includes('the witcher 3')) return 980;
  if (t.includes('ea sports fc') && t.includes('estándar')) return 978;
  if (t.includes('ea sports fc')) return 975;
  if (t.includes('hogwarts legacy')) return 970;
  if (t.includes('nba 2k26')) return 968;
  if (t.includes('elder scrolls v: skyrim')) return 965;
  if (t.includes('elden ring')) return 960;
  if (t.includes('lies of p')) return 955;
  if (t.includes('red dead redemption') && !t.includes('2')) return 950;
  if (t.includes('forza horizon 5')) return 945;
  if (t.includes('sea of thieves')) return 940;
  if (t.includes('call of duty')) return 935;
  if (t.includes('assassin\'s creed') && t.includes('mirage')) return 930;
  if (t.includes('assassin\'s creed') && t.includes('valhalla')) return 928;
  if (t.includes('assassin\'s creed') && t.includes('odyssey')) return 925;
  
  // Tier A - Very well known
  if (t.includes('mortal kombat 11')) return 900;
  if (t.includes('crash bandicoot')) return 895;
  if (t.includes('batman: arkham')) return 890;
  if (t.includes('star wars jedi')) return 885;
  if (t.includes('spyro')) return 880;
  if (t.includes('mass effect') && t.includes('legendary')) return 875;
  if (t.includes('resident evil village')) return 873;
  if (t.includes('resident evil 2') && !t.includes('revelations')) return 871;
  if (t.includes('resident evil 3') && !t.includes('revelations')) return 870;
  if (t.includes('resident evil 7')) return 868;
  if (t.includes('bioshock')) return 865;
  if (t.includes('mafia trilogy')) return 860;
  if (t.includes('borderlands 3')) return 855;
  if (t.includes('it takes two')) return 850;
  if (t.includes('battlefield') && t.includes('2042')) return 848;
  if (t.includes('battlefield') && t.includes('v ')) return 845;
  if (t.includes('battlefield') && t.includes('1')) return 843;
  if (t.includes('battlefield 4')) return 840;
  if (t.includes('little nightmares iii')) return 838;
  if (t.includes('dragon ball fighter')) return 835;
  if (t.includes('dragon ball z: kakarot')) return 833;
  if (t.includes('dragon ball xenoverse 2')) return 830;
  if (t.includes('tekken 7')) return 828;
  if (t.includes('mortal kombat xl')) return 825;
  if (t.includes('injustice') && t.includes('2')) return 820;
  if (t.includes('need for speed') && t.includes('heat')) return 815;
  if (t.includes('far cry 6') || t.includes('farcry 6')) return 810;
  if (t.includes('far cry® 5') || t.includes('far cry 5')) return 808;
  if (t.includes('titanfall') && t.includes('2')) return 805;
  if (t.includes('destiny 2')) return 800;
  if (t.includes('fallout 4')) return 798;
  if (t.includes('atomic heart')) return 795;
  if (t.includes('dying light 2')) return 793;
  if (t.includes('dead island 2')) return 790;
  if (t.includes('watch dogs') && t.includes('2')) return 788;
  if (t.includes('watch dogs') && t.includes('legion')) return 785;
  if (t.includes('rainbow six siege')) return 783;
  if (t.includes('no man\'s sky')) return 780;
  if (t.includes('stray')) return 778;
  if (t.includes('cyberpunk')) return 775;
  if (t.includes('star wars') && t.includes('squadrons')) return 773;
  if (t.includes('star wars') && t.includes('battlefront')) return 770;
  if (t.includes('paquete triple de ea star wars')) return 768;
  if (t.includes('minecraft legends')) return 765;
  if (t.includes('minecraft dungeons')) return 763;
  if (t.includes('marvel\'s guardians')) return 760;
  if (t.includes('halo 5')) return 758;
  if (t.includes('ori and the will')) return 755;
  
  // Tier B - Well known
  if (t.includes('kingdom hearts')) return 740;
  if (t.includes('final fantasy')) return 738;
  if (t.includes('nier:automata')) return 735;
  if (t.includes('devil may cry')) return 730;
  if (t.includes('a way out')) return 725;
  if (t.includes('assassin\'s creed')) return 720;
  if (t.includes('far cry')) return 715;
  if (t.includes('tomb raider')) return 710;
  if (t.includes('lego® star wars')) return 708;
  if (t.includes('little nightmares')) return 705;
  if (t.includes('ace combat')) return 700;
  if (t.includes('soulcalibur')) return 698;
  if (t.includes('a plague tale')) return 695;
  if (t.includes('subnautica')) return 693;
  if (t.includes('naruto')) return 690;
  if (t.includes('one piece')) return 688;
  if (t.includes('jojo\'s bizarre')) return 685;
  if (t.includes('jujutsu kaisen')) return 683;
  if (t.includes('scarlet nexus')) return 680;
  if (t.includes('dark pictures anthology')) return 678;
  if (t.includes('prince of persia')) return 675;
  if (t.includes('south park')) return 673;
  if (t.includes('burnout') && t.includes('paradise')) return 670;
  if (t.includes('l.a. noire')) return 668;
  if (t.includes('prey')) return 665;
  if (t.includes('immortals fenyx')) return 663;
  if (t.includes('diablo')) return 660;
  if (t.includes('overcooked')) return 658;
  if (t.includes('tony hawk')) return 655;
  if (t.includes('slay the spire')) return 653;
  if (t.includes('outer wilds')) return 650;
  if (t.includes('metro')) return 648;
  if (t.includes('mad max')) return 645;
  if (t.includes('for honor')) return 643;
  if (t.includes('sleeping dogs')) return 640;
  if (t.includes('yakuza')) return 638;
  if (t.includes('the quarry')) return 635;
  if (t.includes('la tierra media') || t.includes('middle earth') || t.includes('shadow')) return 633;
  if (t.includes('state of decay')) return 630;
  if (t.includes('kingdom come')) return 628;
  if (t.includes('dragon age')) return 625;
  if (t.includes('deus ex: mankind')) return 623;
  if (t.includes('age of empires')) return 620;
  if (t.includes('crysis remastered')) return 618;
  if (t.includes('crash') && t.includes('team racing')) return 615;
  if (t.includes('life is strange')) return 613;
  if (t.includes('dying light')) return 610;
  if (t.includes('xcom')) return 608;
  if (t.includes('civilization')) return 605;
  if (t.includes('armored core')) return 603;
  if (t.includes('sonic origins')) return 600;
  if (t.includes('teenage mutant ninja')) return 598;
  if (t.includes('dayz')) return 595;
  if (t.includes('resident evil')) return 593;
  if (t.includes('need for speed')) return 590;
  if (t.includes('back 4 blood')) return 588;
  if (t.includes('borderlands')) return 585;
  if (t.includes('saints row')) return 583;
  if (t.includes('the division')) return 580;
  if (t.includes('walking dead') && t.includes('definitive')) return 578;
  if (t.includes('unpacking')) return 575;
  if (t.includes('lego')) return 573;
  if (t.includes('Disney Epic Mickey')) return 570;
  
  // Tier C - Known / Niche
  if (t.includes('riders republic')) return 550;
  if (t.includes('terraria')) return 548;
  if (t.includes('wreckfest')) return 545;
  if (t.includes('snowrunner')) return 543;
  if (t.includes('slime rancher')) return 540;
  if (t.includes('risk of rain 2')) return 538;
  if (t.includes('plants vs. zombies')) return 535;
  if (t.includes('worms')) return 533;
  if (t.includes('streets of rage')) return 530;
  if (t.includes('just cause')) return 528;
  if (t.includes('the crew')) return 525;
  if (t.includes('dirt') || t.includes('DiRT')) return 523;
  if (t.includes('carx drift')) return 520;
  if (t.includes('wobbly life')) return 518;
  if (t.includes('castle crashers')) return 515;
  if (t.includes('stellaris')) return 513;
  if (t.includes('texas chain saw')) return 510;
  if (t.includes('topspin') || t.includes('top spin')) return 508;
  if (t.includes('kerbal')) return 505;
  if (t.includes('ni no kuni')) return 503;
  if (t.includes('tales of')) return 500;
  if (t.includes('warhammer')) return 498;
  if (t.includes('tiny tina')) return 495;
  if (t.includes('greedfall')) return 493;
  if (t.includes('vampyr')) return 490;
  if (t.includes('evil west')) return 488;
  if (t.includes('aliens')) return 485;
  if (t.includes('disco')) return 483;
  if (t.includes('mugrunner') || t.includes('mudrunner')) return 480;
  if (t.includes('mirror\'s edge')) return 478;
  if (t.includes('danganronpa')) return 475;
  if (t.includes('doki doki')) return 473;
  if (t.includes('my hero')) return 470;
  if (t.includes('one punch man')) return 468;
  if (t.includes('dragon ball')) return 465;
  if (t.includes('sd gundam')) return 463;
  if (t.includes('hot wheels')) return 460;
  if (t.includes('stranded deep')) return 458;
  if (t.includes('insurgency')) return 455;
  if (t.includes('payday')) return 453;
  if (t.includes('watch_dogs') || t.includes('watch dogs')) return 450;
  if (t.includes('ultimate marvel')) return 448;
  if (t.includes('harry potter') || t.includes('quidditch')) return 445;
  if (t.includes('monster jam')) return 443;
  if (t.includes('unravel')) return 440;
  if (t.includes('disney') && t.includes('epic mickey')) return 438;
  if (t.includes('choo-choo charles')) return 435;
  if (t.includes('world war z')) return 433;
  if (t.includes('prototype')) return 430;
  if (t.includes('gunfire reborn')) return 428;
  if (t.includes('outriders')) return 425;
  if (t.includes('chorus')) return 423;
  if (t.includes('rugby')) return 420;
  if (t.includes('dead rising')) return 418;
  if (t.includes('dredge')) return 415;
  if (t.includes('signalis')) return 413;
  if (t.includes('fobia')) return 410;
  if (t.includes('chants of sennaar')) return 408;
  if (t.includes('bugsnax')) return 405;
  if (t.includes('what remains of edith')) return 403;
  if (t.includes('uno')) return 400;
  if (t.includes('ancestors')) return 398;
  if (t.includes('dreamfall')) return 395;
  if (t.includes('construction simulator')) return 393;
  if (t.includes('police simulator')) return 390;
  if (t.includes('zoo tycoon')) return 388;
  if (t.includes('yu-gi-oh')) return 385;
  if (t.includes('little kitty')) return 383;
  if (t.includes('core keeper')) return 380;
  if (t.includes('wrc')) return 378;
  if (t.includes('ravenswatch')) return 375;
  if (t.includes('gigabash')) return 373;
  if (t.includes('trackmania')) return 370;
  if (t.includes('godfall')) return 368;
  if (t.includes('just shapes')) return 365;
  if (t.includes('dysmantle')) return 363;
  if (t.includes('s.t.a.l.k.e.r')) return 360;
  if (t.includes('trivial pursuit')) return 358;
  if (t.includes('hotel renovator')) return 355;
  if (t.includes('a little to the left')) return 353;
  if (t.includes('jackbox')) return 350;
  if (t.includes('get even')) return 345;
  if (t.includes('thief')) return 343;
  if (t.includes('paw patrol') || t.includes('patrulla canina')) return 340;
  if (t.includes('that time i got reincarnated')) return 338;
  if (t.includes('oregon trail')) return 335;
  if (t.includes('we love katamari')) return 333;
  if (t.includes('heavenly bodies')) return 330;
  if (t.includes('wasteland')) return 328;
  if (t.includes('escapists')) return 325;
  if (t.includes('under the waves')) return 323;
  if (t.includes('morbid')) return 320;
  if (t.includes('unknown 9')) return 318;
  if (t.includes('dolmen')) return 315;
  if (t.includes('lord of the rings: gollum')) return 313;
  if (t.includes('council')) return 310;
  if (t.includes('my time at portia')) return 308;
  if (t.includes('ice age')) return 305;
  if (t.includes('make way')) return 303;
  if (t.includes('rubber bandits')) return 300;
  if (t.includes('hora de aventuras')) return 298;
  if (t.includes('call of the wild')) return 295;
  if (t.includes('expeditions')) return 293;
  if (t.includes('windbound')) return 290;
  if (t.includes('rush: a disney')) return 288;
  if (t.includes('super mega baseball')) return 285;
  if (t.includes('kona')) return 280;
  if (t.includes('11-11 memories')) return 278;
  if (t.includes('namco museum')) return 275;
  if (t.includes('slay the princess')) return 273;
  if (t.includes('my little pony')) return 270;
  if (t.includes('peppa pig')) return 268;
  if (t.includes('eFootball') || t.includes('efootball')) return 265;
  if (t.includes('stuffed')) return 260;
  if (t.includes('spiritfall')) return 258;
  if (t.includes('necropolis')) return 255;
  if (t.includes('extinction')) return 253;
  if (t.includes('car driving school')) return 250;
  if (t.includes('60 seconds')) return 248;
  if (t.includes('sos ops')) return 245;
  if (t.includes('golf with your friends')) return 243;
  
  // Default for anything not matched
  return 200;
}

// ==================== PROCESS ====================

const MIN_PRICE = 50;
const MAX_PRICE = 500;

// Filter and process games
let filteredGames = rawGames.filter(game => {
  // Price range filter
  if (game.salePrice < MIN_PRICE || game.salePrice > MAX_PRICE) return false;
  
  // DLC filter
  if (isDLC(game.title)) return false;
  
  // Xbox 360 filter
  if (isXbox360(game.title)) return false;
  
  return true;
});

// Remove duplicates (keep the cheaper one)
const seen = new Map();
filteredGames.forEach(game => {
  const key = game.title;
  if (!seen.has(key) || seen.get(key).salePrice > game.salePrice) {
    seen.set(key, game);
  }
});
filteredGames = Array.from(seen.values());

// Sort by popularity (highest score first)
filteredGames.sort((a, b) => getPopularityScore(b.title) - getPopularityScore(a.title));

// Build final JSON
const output = filteredGames.map((game, index) => ({
  id: String(index + 1),
  title: game.title,
  image: `/placeholder.png`,
  originalSalePrice: game.salePrice,
  originalFullPrice: game.originalPrice,
  discount: game.discount,
  platform: "Xbox One, Series X|S"
}));

// Write output
const outputPath = path.resolve(__dirname, '../public/data/games.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

console.log(`✅ Se generaron ${output.length} juegos filtrados y ordenados por popularidad.`);
console.log(`   Rango de precios: $${MIN_PRICE} - $${MAX_PRICE} MXN`);
console.log(`   Excluidos: Xbox 360, complementos/DLC`);
console.log(`\nPrimeros 10 juegos:`);
output.slice(0, 10).forEach(g => {
  console.log(`   ${g.id}. ${g.title} - $${g.originalSalePrice} MXN (${filteredGames[parseInt(g.id)-1].discount})`);
});
