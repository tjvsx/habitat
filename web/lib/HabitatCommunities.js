import { 
  ethers,
  getSigner, 
  checkScroll, 
  wrapListener, 
  getEtherscanLink, 
  walletIsConnected } from '/lib/utils.js';
import { 
  getProviders, 
  pullEvents, 
  onChainUpdate, 
  getReceipt, 
  getMetadataForTopic,
  queryTransfers,
  decodeMetadata, 
  getCommunityInformation } from '/lib/rollup.js';
import HabitatPanel from '/lib/HabitatPanel.js';
import '/lib/HabitatCommunityPreviewCreator.js';
import './HabitatFlipCard.js';

//import { COMMON_STYLESHEET } from './component.js';

const SVG_SORT_ICON = `<svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M12.0871 8.91294V1H20V8.91294H12.0871ZM19.2176 1.78235H12.8918V8.10824H19.2176V1.78235ZM1 12.0871H8.91294V20H1V12.0871ZM1.78235 19.2176H8.10824V12.8918H1.78235V19.2176ZM1 1H8.91294V8.91294H1V1ZM1.78235 8.13059H8.10824V1.80471H1.78235V8.13059ZM16.0435 17.6306L19.5976 13.6741H20V14.4565L16.4459 18.4129H15.6635L12.1094 14.4565V13.6741H12.5118L16.0435 17.6306Z" fill="black" stroke="black" stroke-width="0.4"/>
</svg>`

const COMMUNITY_PREVIEW_TEMPLATE = `
<habitat-flip-card>
  <div slot='front'>
    <div id='community-card'>
      <div id='front-title' class='titles'>
        <a class='title'></a>
      </div>
      <div id='banner-container'>
        <div id='front-banner'>
          <a id='banner'><img></a>
        </div>
      </div>
    </div>
  </div>
  <div slot='back'>
    <div id='description-card'>
      <div id='back-title'>
        <a class='title'></a>
      </div>
        <div id='description'>
          <p id='details'></p>
        </div>
    </div>
  </div>
</habitat-flip-card>
`;

class HabitatCommunities extends HabitatPanel {
  
  static TEMPLATE =
  `
  <style>
  #allCommunities, #userCommunities {
    gap: 2em;
    margin-bottom: 5em;
  }
  .flip-card {
    cursor: pointer;
    min-width: 15em;
    max-width: 30em;
    flex: 1 1 0;
  }
  #community-card {
    min-height: 10em;
    width:100%;
    height:100%;
  }
  #front-title {
    height:25%;
    padding: 1rem 2rem;
  }
  #banner-container {
    width:100%;
    aspect-ratio: 2/1;
  }
  #front-banner {
    width: 100%;
    height: 100%;
    border-radius: 2em;
    background:white;
    overflow:hidden;
  }
  #front-banner img {
    width:100%;
    height:100%;
    display: block;
    object-fit:cover;
  }

  #description-card {
    min-height: 11em;
    height: var(--backHeight);
    width: var(--backWidth);
  }
  #description-card * {
    color: var(--color-text-invert);
  }
  #back-title {
    height:20%;
    padding: 1rem 2rem;
  }
  #description {
    padding: 1rem 2rem;
    height: 90%;
    cursor:default;
  }
  #details {
    height:85%;
    min-width:11em;
    overflow:auto;
  }

  #buttons * {
    margin-right: 0;
  }
  #community {
    visibility:hidden;
  }
  #community.visible {
    visibility:visible;
  }
  #community.active {
    background: var(--color-bg-invert);
    color: var(--color-text-invert);
    transition: all .2s linear;
  }
  #sort {
    display: block;
    padding: .375em 1em;
    margin-left: .5em;
  }
  #sort-dropdown {
    display:none;
  }
  #sort-dropdown.active {
    display:block;
  }
  #sort-options {
    position:absolute;
    right:5%;
    margin-top:2em;
    z-index:1;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.5);
    outline: none;
  }
  #sort-options * {
    display:block;
    padding:1em 0;
    cursor:pointer;
  }
  #userCommunitiesTitle {
    display: none;
    padding: 1rem 1rem 0 0;
  }
  #userCommunitiesTitle.visible {
    display: block;
  }

  
  </style>
  <div style='width:90%;margin-left:auto;margin-right:auto;position:relative;'>

  <space></space>

    <div style='position:absolute;right:0;'>
      <div id='buttons' class='flex row' style='place-content:flex-end;'>
        <button id='community'>Create</button>
        <button id='sort'>${SVG_SORT_ICON}</button>
        <div id='sort-dropdown' style='position:relative;'>
          <ul class='box' id='sort-options'>
            <li id='sort-az' >A - Z</li>
            <li id='sort-za' >Z - A</li>
            <li id='sort-recent' >Recent</li>
          </ul>
        </div>
      </div>
    </div>


    <p id='userCommunitiesTitle' class='l light' style='padding-bottom:2em;'><span><emoji-herb></emoji-herb><span> Your Communities</span></span></p>
    <div id='userCommunities' class='flex row center evenly'></div>
      
    <p class='l light' style='padding-bottom:2em;'><span><emoji-camping></emoji-camping><span> Communities on Habitat</span></span></p>
    <div id='allCommunities' class='flex row center evenly'></div>

  </div>
  `;

  constructor() {
    super();

    this.sortBtn = this.shadowRoot.querySelector('button#sort');
    this.dropdown = this.shadowRoot.querySelector('#sort-dropdown');
    this.selector = this.shadowRoot.querySelector('#sort-options');

    this._loaded = {};
    this._userLoaded = {};

    this.communities = []; // for sorting / watching
    this.userCommunities = []; // for sorting / watching

    this.tokens = []; //for comparison

    this.allContainer = this.shadowRoot.querySelector('#allCommunities');
    this.userContainer = this.shadowRoot.querySelector('#userCommunities');

    this.sortBtn.addEventListener('click', evt => {
        evt.stopPropagation();
        this.dropdown.classList.toggle('active');
        if (this.dropdown.classList.contains('active')) {
          this.selector.addEventListener('click', evt => {
            if (evt.target.id.startsWith('sort-') && !evt.target.id.match('sort-options')) {

              this.userContainer.innerHTML = '';
              this._userLoaded = {};

              this.allContainer.innerHTML = '';
              this._loaded = {};

              if (evt.target.id === 'sort-az') {
                this.communities.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
                this.userCommunities.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
              }
              if (evt.target.id === 'sort-za') {
                this.communities.sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase()) ? 1 : -1);
                this.userCommunities.sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase()) ? 1 : -1);
              }
              if (evt.target.id === 'sort-recent') {
                this.communities.sort((a, b) => (a.block < b.block) ? 1 : -1);
                this.userCommunities.sort((a, b) => (a.block < b.block) ? 1 : -1);
              }
            }
          }, false);
          //click anywhere in "communities" to close
          this.shadowRoot.addEventListener('click', evt => { //or evt.target is sortBtn
            if (!evt.target.id.startsWith('sort-')) {
              this.dropdown.classList.remove('active');
            }
          }, false);
        }
    });

    checkScroll(
      this.shadowRoot.querySelector('#content'),
      () => {
        for (const community of this.communities) {
          if (!this._loaded[community.transactionHash]) {
            this._loaded[community.transactionHash] = true;
            this.renderCommunity(this.allContainer, community);
          }
        }
      }
    );
    
    this._userLoad(
      () => {
        for (const community of this.userCommunities) {
          if (!this._userLoaded[community.transactionHash]) {
            this._userLoaded[community.transactionHash] = true;
            this.renderCommunity(this.userContainer, community);
          }
        }
      }
    );

  }

  get title () {
    return 'Communites';
  }

  _userLoad (callback) {
    async function _check () {
      await callback();
      window.requestAnimationFrame(_check);
    }
    _check();
  }

  //render elements
  async render () {
    const { habitat } = await getProviders();

    if (walletIsConnected()) {
      this.shadowRoot.querySelector('button#community').classList.toggle('visible');
      //toggle your communities on
      const signer = await getSigner();
      let address = await signer.getAddress();
      this.tokens = (await queryTransfers(address)).tokens;
      this.shadowRoot.querySelector('#userCommunitiesTitle').classList.toggle('visible');
    }

    wrapListener(
      this.shadowRoot.querySelector('button#community'),
      (evt) => {
        let createCommunityCard = this.shadowRoot.querySelector('habitat-community-preview-creator');
        if (createCommunityCard) {
          alert('1 community creator card allowed at a time');
        }
        else {
          this.shadowRoot.querySelector('button#community').classList.toggle('active');
          this.shadowRoot.querySelector('#userCommunities').prepend(document.createElement('habitat-community-preview-creator'));
        }
      }
    );
    
    const filter = habitat.filters.CommunityCreated();
    filter.toBlock = await habitat.provider.getBlockNumber();
    for await (const evt of pullEvents(habitat, filter, filter.toBlock)) {
        const { communityId, governanceToken } = evt.args;
        const metadata = await getMetadataForTopic(communityId);
        // const memberCount = await habitat.callStatic.getTotalMemberCount(communityId);
        const community = {
          transactionHash: evt.transactionHash,
          name: metadata.title,
          link: `#habitat-community,${evt.transactionHash}`,
          token: governanceToken,
          // members: memberCount,
          block: evt.block,
          details: metadata.details,
          banner: metadata.bannerCid
        }
        if (this.tokens && this.tokens.includes(community.token) && !this.userCommunities[evt.transactionHash]) {
          this.userCommunities.push(community);
        }
        
        if (!this.communities[evt.transactionHash]) {
          this.communities.push(community);
        }

    }
  }
  async renderCommunity (container, community, prepend = false) {
    const ele = document.createElement('div');
    ele.innerHTML = COMMUNITY_PREVIEW_TEMPLATE;
    ele.classList.add('flip-card');

    ele.dataset.name = community.name;
    ele.dataset.block = community.block;

    let titles = ele.querySelectorAll('a.title');
    for (const title of titles) {
      title.textContent = (community.name ? community.name : '') || '???';
      title.href = community.link;
    }
    ele.querySelector('a#banner').href = community.link;

    ele.querySelector('p#details').innerHTML = community.details;

    if (community.banner) {
      ele.querySelector('img').src = `https://${community.banner}.ipfs.infura-ipfs.io/`;
    } else {
      ele.querySelector('img').src = `https://bafkreiawxlr6ljlqitbhpxnkipsf35vefldej2r4tgoozxonilyinwohyi.ipfs.infura-ipfs.io/`;
    }

    if (prepend) {
      container.prepend(ele);
    } else {
      container.append(ele);
    }
  }

  //updater
  async chainUpdateCallback () {
    await this.fetchLatest();
  }

  //propogate newly created community
  async chainUpdateCallback () {
    await this.fetchLatest();
  }

  async fetchLatest () {
    const { habitat } = await getProviders();
    const filter = habitat.filters.CommunityCreated();
    filter.toBlock = await habitat.provider.getBlockNumber();

    for await (const evt of pullEvents(habitat, filter, 1)) {
      if (!this._loaded[evt.transactionHash]) {
        this._loaded[evt.transactionHash] = true;
        this.renderCommunity(this.allContainer, evt, true);
      }
    }
  }
  
}
customElements.define('habitat-communities', HabitatCommunities);
