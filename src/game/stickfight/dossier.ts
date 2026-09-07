/**
 * The long-form half of a fighter's profile: what they actually carried, and
 * what actually happened.
 *
 * Kept here rather than on each fighter file for the same reason strings and
 * factions are. A fighter file is a move list - four hundred lines of frame
 * data and keyframes - and burying two paragraphs of prose in the middle of it
 * means the prose is edited by whoever is editing hitboxes, which is nobody.
 * One file also makes the roster's writing legible as a body of writing: you
 * can read all of it at once and see where the tone has drifted.
 *
 * `bio` on the fighter stays what it is, a couple of lines for the select
 * screen. `history` here is the fuller account, and it has to earn the space -
 * a profile page that only restates the blurb in more words is worse than one
 * that says nothing, because the player has already read it and now has to
 * find that out again.
 *
 * The rule for both fields is the same rule the rest of this roster runs on:
 * everything here is either in the record or flagged as not being in it. Where
 * the record is thin - Kuro has none at all, Hydarnes has three sentences of
 * Herodotus - the entry says so rather than filling the gap.
 */

export interface SignatureWeapon {
  /** What it is called. */
  name: string;
  /** What it does in the fighter's hands, in three or four words. */
  role: string;
  /** One line on the object itself. Shown on hover and on wide layouts. */
  note: string;
}

export interface Dossier {
  /** The fuller account. Three to five sentences. */
  history: string;
  /** The two or three objects the kit is built around. */
  arsenal: SignatureWeapon[];
}

export const DOSSIERS: Record<string, Dossier> = {
  roman: {
    history:
      "Caesar names Vorenus and Titus Pullo in Book V of the Gallic War, in the middle of an account of the Nervii siege, purely to tell a story about two centurions who could not stand each other. Each went over the rampart to outdo the other, each got into trouble alone, and each had to be pulled out by the man he was trying to beat. It is a strange thing to find in a campaign report, and it is the only reason either name survives. Everything else about him - the century he held, where he died, whether he lived through the winter - is gone.",
    arsenal: [
      { name: "Scutum", role: "Wall and weapon", note: "Curved plywood body shield, faced in linen and hide, iron boss at the centre. Heavy enough to be swung." },
      { name: "Pilum", role: "Thrown, once", note: "Soft iron shank behind a hardened point: it bends on impact so it cannot be thrown back, and fouls whatever it hits." },
      { name: "Gladius", role: "Close work behind the shield", note: "Short, wide, and made for the half-metre of space a shield wall leaves you." },
    ],
  },

  spartan: {
    history:
      "The exchange about the arrows is one line in Herodotus, and it is the whole reason anyone knows the name. He was a Spartiate in the three hundred at Thermopylae in 480 BC - a full citizen of a state that trained its citizens for nothing else - and he died there with the rest of them on the third day, after the Persians came round the pass by the mountain track. Herodotus goes out of his way to say he was reckoned the bravest of the Spartans, which from Herodotus about a Spartan is a considered judgement rather than a courtesy.",
    arsenal: [
      { name: "Dory", role: "The whole fight, most of the time", note: "Two and a half metres of ash with an iron head at one end and a bronze butt-spike at the other, for when the head breaks off." },
      { name: "Aspis", role: "Yours and the next man's", note: "Round, bowl-shaped, gripped at the forearm and the rim - which is why it covers your left and your neighbour's right, and why a phalanx is a formation rather than a crowd." },
      { name: "Javelins", role: "Before they arrive", note: "Lighter shafts thrown at a run-up, spent well before the lines meet." },
    ],
  },

  viking: {
    history:
      "Both Vinland sagas have Freydís, and they do not agree about her. The Saga of Erik the Red gives her the beach at Vinland: the Norse break and run from a Skræling attack, she is pregnant and cannot keep up, and she turns, picks up a dead man's sword, bares her chest and beats the flat of the blade against it until the attackers withdraw. The Greenland Saga gives her a second expedition and an outright massacre - her partners killed in their sleep on her word, and the five women of their party killed by her own hand when no man would do it. Neither saga was written down for two centuries, both are literature as much as record, and she is the only person on this roster whose sources call her a hero and a murderer in the same breath.",
    arsenal: [
      { name: "Bearded axe", role: "Hooks, then splits", note: "The drooping lower edge gives a long cutting face on a light head, and a hook for pulling a shield rim down." },
      { name: "Buckler", role: "Punched, not held", note: "Small centre-grip shield. Used to deflect and to hit with, not to hide behind." },
    ],
  },

  pirate: {
    history:
      "Bonny appears in the record properly only at the end: Captain Barnet took Rackham's sloop off Negril Point in October 1720 and the whole crew was tried in Jamaica in November. The court heard that when the boarders came over the rail the men were below and drunk, and that Bonny and Mary Read fought the boarding alone. All of them were sentenced. Bonny and Read both pleaded their bellies - both were pregnant, which under English law stayed a hanging - and both were spared. Read died of a fever in prison within months. What happened to Bonny is genuinely not known; she was not hanged, and after that the record simply stops.",
    arsenal: [
      { name: "Cutlass", role: "Boarding weapon", note: "Short, heavy, single-edged. Made for a crowded deck where a long blade has nowhere to go." },
      { name: "Flintlock pistols", role: "One shot each, then clubs", note: "Carried several at a time on a ribbon across the chest, because reloading during a boarding is not a plan." },
      { name: "Six-pounder", role: "The ship's argument", note: "The sloop's own gun, which she has no business being able to lay and fire alone, and does anyway." },
    ],
  },

  samurai: {
    history:
      "Tomoe Gozen belongs to the Tale of the Heike rather than to any document, which is not the same as saying she was invented - the Heike is a war chronicle that hardened into an epic, and she is in the oldest layers of it. It gives her to Minamoto no Yoshinaka as his finest fighter, says she was worth a thousand and fit to be sent against god or demon alike, and puts her at Awazu in 1184 in the last hour of his defeat. There she takes a head in front of him, and he orders her away - because, he says, he does not want it said at the end that he died with a woman. What the Heike does not do is say what became of her, and every later account that does is later.",
    arsenal: [
      { name: "Naginata", role: "Reach and the sweep", note: "Curved blade on a long shaft. Cuts at spear distance and takes legs and horses, which a sword cannot." },
      { name: "Tachi", role: "Drawn once, decisively", note: "Slung edge-down from the belt, cut on the draw." },
      { name: "Yumi", role: "From the saddle", note: "Asymmetric laminated bow, gripped a third of the way up so it can be shot from horseback." },
    ],
  },

  muaythai: {
    history:
      "Ayutthaya fell to the Burmese in 1767 and the prisoners went north. Thai accounts have Nai Khanom Tom brought out at a festival in 1774 in front of the Burmese king to fight a Burmese champion, beating him, and then being told the win did not count because he had been dancing beforehand - the wai kru, the ritual salute to his teachers, which the court had never seen. So he fought nine more, one after another with no rest, and beat all nine. The king freed him. The story survives in Thai chronicle rather than in anything Burmese, and 17 March is still fought as a national day on the strength of it.",
    arsenal: [
      { name: "Kaad chuek", role: "The hands themselves", note: "Hemp cord wound over the knuckles and up the forearm. It does not protect the hand; it makes the hand harder." },
      { name: "Mongkhon and prajioud", role: "Worn, not fought with", note: "Head cord and arm bands, blessed before the fight. The mongkhon comes off before the first bell; the prajioud stay on." },
    ],
  },

  ninja: {
    history:
      "Hanzo is the one figure in this whole subject who is properly documented, which is why so much of what gets said about him is not. He was a retainer of the Tokugawa, born to an Iga family, and he fought in Ieyasu's campaigns as a spear officer. The thing he is actually remembered for is not an assassination: when Oda Nobunaga was killed at Honnō-ji in 1582 and Ieyasu was caught in hostile country with a handful of men, Hanzo took him home overland through Iga - a route that only worked because the Iga men had reason to help him and none at all to help anyone else. He died in 1596, in bed. The gate at the Edo castle his men guarded is still called Hanzōmon, and so is the subway line under it.",
    arsenal: [
      { name: "Yari", role: "What he actually fought with", note: "Straight-bladed spear. The record has him as a spear officer, and every account of him in a real fight has him holding one." },
      { name: "Kunai", role: "Thrown, and used close", note: "A digging and prying tool before it was anything else. Thrown when there is distance and held when there is not." },
      { name: "Tantō", role: "The last half-metre", note: "Short blade, drawn when the spear is already too long." },
    ],
  },

  mongol: {
    history:
      "Subutai was a blacksmith's son from the forest tribes, and he ended as the Mongol army's best field commander across two generations of khans and something like twenty campaigns. He beat the Rus and the Cumans at the Kalka in 1223 on a feigned retreat that ran for nine days. Eighteen years later he did it again on a far larger scale: two armies into Europe at once, Poland and Hungary destroyed within two days of each other at Legnica and Mohi, in a coordination nobody on that side of the world thought was possible. He was recalled when Ögedei died, and the invasion never resumed.",
    arsenal: [
      { name: "Composite bow", role: "The campaign, essentially", note: "Horn, wood and sinew, short enough to shoot from a saddle and heavier at the draw than anything infantry carried." },
      { name: "Knife", role: "Second answer", note: "Drawn when someone has closed the distance the bow exists to keep." },
      { name: "Caltrops", role: "Where they will be", note: "Scattered behind on the withdrawal, so the pursuit costs something." },
    ],
  },

  western: {
    history:
      "The gunfight lasted about thirty seconds in a vacant lot on Fremont Street, not at the O.K. Corral, on 26 October 1881. Three men died. Wyatt Earp was the only one of the five on his side who was not hit. What followed mattered more: Virgil Earp was ambushed and crippled that December, Morgan Earp was shot dead at a billiard table in March, and Wyatt spent the next weeks riding the county killing the men he held responsible, with a federal warrant in his pocket and a county murder warrant out for him. He was never tried. He died in Los Angeles in 1929, at eighty, having outlived every other man in the lot.",
    arsenal: [
      { name: "Colt revolver", role: "Six, deliberately", note: "Single-action. Every shot is a decision, because the hammer has to be pulled back for each one." },
      { name: "Dynamite", role: "Nobody's idea of a fair fight", note: "Common as dirt in a mining town, and about as regulated." },
    ],
  },

  soldier: {
    history:
      "The Ia Drang in November 1965 was the first full engagement between American and North Vietnamese regulars, and it was fought twice. At Landing Zone X-Ray a battalion of the 1st Cavalry was put down by helicopter almost on top of a division-sized force, held a clearing about the size of a football pitch for three days, and was extracted. Two days later a second battalion walking out overland was ambushed at Landing Zone Albany and lost more men in a few hours than X-Ray had lost in three days. Both sides read the result as proof they could win. This fighter is a composite: the valley, the unit and every piece of the kit are real, and the man is all of them.",
    arsenal: [
      { name: "M16", role: "Volume", note: "New in 1965, and in that year not yet issued with cleaning kits, which is its own piece of history." },
      { name: "M7 bayonet", role: "When the line is inside the wire", note: "Fixed to the rifle or held; either way it is what is left when the magazine is." },
      { name: "M26 grenade", role: "Around the corner", note: "The answer to a position you cannot shoot into." },
    ],
  },

  knight: {
    history:
      "Chandos is the closest thing the Hundred Years War has to a professional: at Crécy in 1346, at Poitiers in 1356 where he stayed at the Black Prince's shoulder through the whole day, at Auray in 1364 where he took Bertrand du Guesclin prisoner, and Constable of Aquitaine in between. Froissart, who did not hand these out, calls him wise and full of devices. He was blind in one eye from a hunting accident and it made no apparent difference to any of it. He died in 1370 of a wound taken in a skirmish at Lussac bridge - slipped on frozen ground in his own robe, took a lance in the face on the blind side, and lasted a day.",
    arsenal: [
      { name: "Longsword", role: "Two hands, close", note: "Handled in armour by the half-sword: one hand on the blade, aiming for the gaps rather than trying to cut plate." },
      { name: "Heater shield", role: "The line, not the duel", note: "Small enough to move in, large enough that a lance has to go round it." },
      { name: "Plate harness", role: "Worn, and it counts", note: "Not a costume. The reason a knight can walk into a blow that would end anyone else on this roster." },
    ],
  },

  jaguar: {
    history:
      "The Florentine Codex - Sahagún's Nahuatl-language account, taken from Mexica survivors a generation later - remembers Tzilacatzin of Tlatelolco by name, which for an individual warrior on that side is rare. It has him breaking Spanish and allied advances with nothing but hurled stones, three of them carried at a time, and changing his insignia every day so that the crossbowmen and harquebusiers could never learn which man to shoot at. He is one of the very few defenders of the siege we can still put a name and a tactic to, and the account of him comes from his own side.",
    arsenal: [
      { name: "Macuahuitl", role: "Cuts, then stops cutting", note: "Hardwood blade set with obsidian along both edges. Sharper than steel and gone in a few blows." },
      { name: "Atlatl", role: "Before they are close", note: "Spear-thrower. Adds a joint to the arm and about doubles what the arm can do." },
      { name: "Hurled stones", role: "What the Codex remembers", note: "Three at a time. Unglamorous, and the specific thing his own side wrote down about him." },
    ],
  },

  zulu: {
    history:
      "Mgobozi was Shaka's companion from before Shaka was anything, and an induna of the Fasimba - the young regiment Shaka built his method on. Gqokli Hill in 1818 is the battle that made the method: outnumbered, with the water sources held against him, Shaka put his force on a hill in a circle with a reserve hidden in the dead ground behind the crest, let Zwide's Ndwandwe come up the slope in column all day, and sent the reserve out at the end. Most of what survives of Mgobozi personally comes through E. A. Ritter's Shaka Zulu, which is oral tradition worked into a novelist's shape - so he is real, the regiment is real, the battle is real, and the individual detail should be held more loosely than the rest.",
    arsenal: [
      { name: "Iklwa", role: "One distance only", note: "Short stabbing spear. Named for the sound it makes coming out. Not thrown - throwing it is throwing away your weapon." },
      { name: "Isihlangu", role: "Hooks the other man's", note: "Full-length cowhide shield. Its edge is used to catch an opponent's shield and turn him open." },
    ],
  },

  shaolin: {
    history:
      "In the 1550s the Ming coast was being raided by the wokou - pirate bands, Japanese and Chinese both - and the coastal garrisons were not holding. The court took the unusual step of asking the monasteries for men. Around forty fighting monks from Shaolin went to the Jiangnan coast under a monk-officer, and the campaign is recorded on both sides: they won at Wengjiagang in 1553, and they were nearly wiped out later at another engagement they should not have been sent to. Yuekong is one of the names attached to the command in the sources, thinly. The staff is not a stylistic choice - it is what lets a man who has taken a vow against killing decide, blow by blow, whether he is going to keep it.",
    arsenal: [
      { name: "Iron-shod staff", role: "Everything, at every range", note: "A staff can break a man or only knock him down, and the man holding it chooses which. That is the point of carrying one." },
    ],
  },

  nihang: {
    history:
      "Akali Phula Singh led the Nihangs - the standing armed order of the Khalsa - through Ranjit Singh's campaigns at Kasur, Multan, Kashmir and Peshawar. He is also the man who summoned the Maharaja of the Punjab to the Akal Takht to answer for his conduct and had him accept a public flogging for it, which tells you exactly what the office was worth against the throne. He died in 1823 at Nowshera, at the head of the charge, in the fight that broke the Afghan hold on the north-west frontier.",
    arsenal: [
      { name: "Tulwar", role: "Curved, and drawn to cut", note: "Disc-pommelled sabre. The grip locks the hand into the arc so the edge arrives at the right angle without being aimed." },
      { name: "Chakram", role: "Thrown flat, and it returns", note: "Sharpened steel ring, spun off the finger or slung underarm. Carried stacked on the dumalla." },
      { name: "Dumalla", role: "Armour that is also a declaration", note: "The tall Nihang turban, wound over steel. It holds the quoits, and it is the reason he is visible from the far end of a field." },
    ],
  },

  shade: {
    history:
      "There is no record, and that is the entry. Kuro is assembled from what the sources actually contain about the shinobi: not a lineage or a school but a persistent local complaint - rice gone, a gate found open, a retainer dead in a room that was locked. Every province has the story and none of them has the man. Whether the mask covers one person, a family, or a job handed on until nobody remembers who started it is left where the record leaves it, which is unresolved. Everything else on this roster is here because somebody wrote it down. He is here because nobody could.",
    arsenal: [
      { name: "Kunai", role: "Held in both hands", note: "The plain iron tool, which is the point: nothing he carries would convict him of anything if he were searched." },
      { name: "Shuriken", role: "Not to kill", note: "Thrown to make a man flinch, cover ground, or stop following." },
      { name: "Smoke", role: "The exit", note: "The only weapon here whose job is to end the fight rather than win it." },
    ],
  },

  maori: {
    history:
      "Te Rauparaha took Ngāti Toa south out of Kāwhia in the 1820s, in the middle of the musket wars, and rebuilt the iwi on Kapiti Island - which he could hold and which the trading ships had to come to. From there he ran a stretch of coast on both sides of the strait for twenty years. In 1846 the Crown took him off his bed at Porirua without charge and held him on a ship and then in Auckland for eighteen months, and released him without ever bringing anything against him. He is also the composer of Ka Mate, which he is said to have put together immediately after hiding in a kūmara pit while men who wanted him searched above it - which is why the words are about stepping up out of a hole into the sun.",
    arsenal: [
      { name: "Taiaha", role: "Both ends work", note: "Hardwood staff with a blade at one end and a carved tongue at the other. Struck, parried and thrust with, and the footwork is the weapon as much as the wood." },
      { name: "Mere pounamu", role: "One blow, close", note: "Greenstone hand club. Not a bludgeon - it is driven edge-first, and it is an heirloom before it is a weapon." },
    ],
  },

  ethiopia: {
    history:
      "Alula was born to a peasant family in Tigray and rose on nothing but performance, ending as Ras of Mereb Melash and Yohannes IV's field commander. He beat the Egyptians at Gura in 1876. On 26 January 1887 at Dogali he destroyed an Italian column of about five hundred men almost to the last - the first serious European defeat in that scramble for the Horn, and the thing that stopped Italy's first attempt on Ethiopia dead. Italian papers called him the Garibaldi of Ethiopia while they were still counting the dead. He died in 1897, the year after Adwa proved Dogali had not been a fluke.",
    arsenal: [
      { name: "Shotel", role: "Round the shield", note: "Deeply curved blade, sharpened on the inside of the arc, made to reach past a shield rather than through it." },
      { name: "Gasha", role: "Small and quick", note: "Round hide shield, often hippo or buffalo, held out from the body rather than against it." },
      { name: "Remington", role: "The rifle that changed the arithmetic", note: "Rolling-block breechloaders, imported in quantity. Dogali was fought by men who had them." },
    ],
  },

  duelist: {
    history:
      "The documented outline is remarkable enough on its own: taught fencing among the pages at Versailles as a child, on the stage at the Paris Opéra as a contralto by her late teens, and pardoned by Louis XIV after being condemned in absentia. She fought duels at a time when duelling was a capital offence, and she won them. Around that outline sits three centuries of accumulated story - the ball where she is said to have taken on three men at once, the convent she is said to have burned - most of it first written down long after her death and none of it verifiable. She retired from the stage around 1705 and died about two years later, in her thirties. Sorting the two halves apart is the honest work, and nobody has finished it.",
    arsenal: [
      { name: "Smallsword", role: "Point, not edge", note: "Light, triangular in section, and useless for cutting. The whole weapon is built around the thrust and the parry." },
      { name: "Main gauche", role: "The left hand", note: "Parrying dagger. It takes the blade so the right hand never has to stop attacking." },
    ],
  },

  iceman: {
    history:
      "Two hikers found him in September 1991 in a gully on the Tisenjoch, on the border, and everyone assumed a recent accident until the equipment came out with him. He was about forty-five, five foot two, lactose intolerant, had worn arthritic joints, whipworm, and sixty-one tattoos placed on acupuncture points. He had eaten ibex and einkorn a few hours before he died. He carried a copper-bladed axe that reset the date of copper working in the Alps by a thousand years, a longbow he had not finished, and fourteen arrows of which two were usable. He was shot in the back with a flint arrowhead that severed an artery, and he had someone else's blood on his knife and his cape. He was not lost. He was being followed.",
    arsenal: [
      { name: "Copper axe", role: "Actual, and dated", note: "Yew haft, bound with birch tar and hide, and a 99.7% copper blade. One of the oldest complete axes in existence and it was in his hand." },
      { name: "Flint dagger", role: "Very short answer", note: "Ash handle, small flint blade, woven grass sheath. He had used it." },
      { name: "Sling", role: "Reach, at distance", note: "The bow in his kit was unfinished. Something had to cover the ground." },
    ],
  },

  celt: {
    history:
      "Vercingetorix did the thing no one had managed: got tribes who had spent centuries fighting each other into one army in 52 BC, and came within a season of ending Caesar's command. He burned Gaulish towns himself to deny Caesar supply, beat him outright at Gergovia, and then made the one mistake - shutting his army inside the hill fort at Alesia. Caesar built a wall round it, and then a second wall facing outward, and held both against a relief army several times his own size. Vercingetorix rode out and surrendered. Caesar kept him alive in a Roman prison for six years so he could be walked through the triumph, and had him strangled the same day.",
    arsenal: [
      { name: "Long sword", role: "Cut from the shoulder", note: "La Tène pattern, long and slashing, made to be swung with room rather than thrust in a press." },
      { name: "Gaesum", role: "Opens the exchange", note: "Heavy iron javelin. The name is old enough that the Romans borrowed it for the men who carried it." },
      { name: "Carnyx", role: "Not a weapon", note: "Boar-headed war horn, held vertically above the heads of the line. Polybius says the noise alone was a problem." },
    ],
  },

  persian: {
    history:
      "Hydarnes commanded the Ten Thousand - the standing corps Herodotus calls the Immortals because its strength was kept exactly at ten thousand, every casualty replaced at once. His father was one of the six conspirators who put Darius on the throne, which is about as high as a Persian family got. At Thermopylae he was given the decisive job: the night march up the goat track that Ephialtes betrayed, round the pass and down behind the Greeks. He did it, and it worked, and Herodotus - who has just spent pages on the men Hydarnes defeated - drops him immediately afterwards and never picks him up again.",
    arsenal: [
      { name: "Composite bow", role: "The corps' real weapon", note: "The volume Herodotus was making a joke about. Carried by every man in the formation." },
      { name: "Short spear", role: "Held at arm's length", note: "Shorter than a dory, which at Thermopylae was the entire problem." },
      { name: "Spara", role: "The wall the archers stand behind", note: "Tall wicker shield, planted rather than carried. A line of them is a firing position." },
    ],
  },

  lapulapu: {
    history:
      "On 27 April 1521 Magellan took about fifty men ashore at Mactan against something on the order of a thousand, and he took them into shallow water where the ships' guns could not reach and the boats could not follow. Pigafetta was in the water watching and wrote it down: they went for the legs, because the legs were the only part not armoured; Magellan's helmet was knocked off twice; he was hit in the arm with a bamboo spear and then in the leg, and went down in the surf with the rest still trying to get to the boats. Lapulapu refused every offer for the body. What is known about him otherwise is almost nothing - the man is the battle, and the battle is one European's diary.",
    arsenal: [
      { name: "Kampilan", role: "Long, and it cuts", note: "Single-edged sword with a forked pommel, longer than most blades in the region and meant for a two-handed swing." },
      { name: "Bangkaw", role: "Fire-hardened, and expendable", note: "Bamboo spear. Pigafetta specifically records these going into Magellan's arm and leg." },
      { name: "Kalasag", role: "Carried, not planted", note: "Long wooden shield, light enough to move at a run through water." },
    ],
  },

  iceni: {
    history:
      "Prasutagus of the Iceni left his kingdom half to his two daughters and half to Nero, on the theory that Rome would honour a will that named the emperor. Rome took all of it, flogged his widow, raped his daughters, and treated the Iceni nobility's estates as spoils. In AD 60 or 61 the province rose. Boudica's army burned Camulodunum, Londinium and Verulamium, killed something Tacitus puts near seventy thousand, and was then destroyed in a single battle somewhere on Watling Street by a Roman force perhaps a twentieth its size, in a defile where numbers could not be brought to bear. The burnt layer from those three fires is still under all three cities, and it is the only physical evidence of any of it.",
    arsenal: [
      { name: "Iceni spear", role: "The line's weapon", note: "Plain, long, and what most of the army she raised was actually holding." },
      { name: "Torch", role: "Camulodunum, Londinium, Verulamium", note: "Not a metaphor. The archaeology of the rising is a layer of ash." },
      { name: "Essedum", role: "Arrives, and leaves", note: "The British chariot: driven in, fought from, jumped down from, and kept close for getting out again." },
    ],
  },

  conquistador: {
    history:
      "Cortés sailed from Cuba in 1519 against his governor's orders, ran his own ships aground on the coast so that no one could sail back and report him, and then spent two years assembling the thing that actually took the city - not an army of Spaniards but an alliance. He fought the Tlaxcalteca, lost, and took them as allies. He was thrown out of Tenochtitlan in 1520 with most of his men dead in one night. He came back with thirteen brigantines carried over the mountains in pieces and reassembled on the lake, cut the causeways and the aqueduct, and took the city street by street over ninety-three days. Smallpox had gone through it first. It fell in August 1521, and what he did afterwards is why his statues are contested and not why they exist.",
    arsenal: [
      { name: "Toledo blade", role: "Steel, against obsidian", note: "The one advantage that did not run out. An edge that keeps working after the fiftieth blow." },
      { name: "Rodela", role: "Small, round, and always up", note: "Steel buckler. Made for the press of a street fight rather than a field." },
      { name: "Crossbow", role: "Slow, and it goes through", note: "Slower than a bow to load and it did not matter, because it went through cotton armour that arrows did not." },
    ],
  },

  shanidar: {
    history:
      "Shanidar 1 was excavated by Ralph Solecki in 1957 from a cave in the Zagros mountains of Iraqi Kurdistan, and he is one of the most-argued-over skeletons ever found. A crushing blow to the left side of his face took the eye. The right arm is withered from disuse and ends above the wrist - amputated or lost. There is damage to the right leg and foot that would have made walking painful and hunting impossible, and hearing loss severe enough that he could not have heard a predator coming. Every one of those injuries had healed, some of them long before he died in his forties. Somebody fed him, and kept feeding him, for years, for nothing. He is the oldest hard evidence we have that people look after each other.",
    arsenal: [
      { name: "Hand-axe", role: "One arm, and it is enough", note: "Held in the left hand, because the right ends above the wrist. Everything in the kit is built round that fact." },
      { name: "Wooden spear", role: "Braced, not thrown", note: "Fire-hardened point. Set against the ground and leaned on, which is what a man with one working arm can actually do with a spear." },
      { name: "Stone", role: "The first weapon there was", note: "Thrown underhand and short. He is forty thousand years before anybody else on this roster." },
    ],
  },
};

export function dossierFor(id: string): Dossier | undefined {
  return DOSSIERS[id];
}
