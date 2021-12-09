import { 
  getSigner, 
  checkScroll, 
  wrapListener,  
  walletIsConnected, 
  getConfig } from '/lib/utils.js';
import { 
  getProviders, 
  pullEvents, 
  getMetadataForTopic,
  queryTransfers,
  onChainUpdate } from '/lib/rollup.js';
import HabitatPanel from '/lib/HabitatPanel.js';
import '/lib/HabitatCommunityPreviewCreator.js';
import './HabitatFlipCard.js';

//import { COMMON_STYLESHEET } from './component.js';

const SVG_SORT_ICON = `<svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.888,9.113L11.888,0.801L20.2,0.801L20.2,9.113L11.888,9.113ZM19.018,1.982L13.092,1.982L13.092,7.909L19.018,7.909L19.018,1.982ZM0.8,11.891L9.112,11.891L9.112,20.2L0.8,20.2L0.8,11.891ZM1.982,19.018L7.914,19.018L7.914,13.091L1.982,13.091L1.982,19.018ZM0.8,0.801L9.112,0.801L9.112,9.113L0.8,9.113L0.8,0.801ZM1.982,7.931L7.914,7.931L7.914,2.004L1.982,2.004L1.982,7.931ZM16.044,17.333L19.508,13.474L20.2,13.474L20.2,14.534L16.535,18.613L15.574,18.613L11.888,14.534L11.91,13.474L12.601,13.474L16.044,17.333Z" fill="black"/>
</svg>`

const COMMUNITY_PREVIEW_TEMPLATE = `
<style>
#community-card {
  min-height: 10em;
  width:100%;
  height:100%;
}
.title {
  display:block;
  width: 92%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  width:100%;
  height:100%;
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
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
#details::-webkit-scrollbar {
  display: none;
}
</style>
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
  #main {
    width:90%;
    margin-left:auto;
    margin-right:auto;
    position:relative;
  }
  #main *,
  #main :before,
  #main :after {
    box-sizing: border-box;
  }
  #communities, #user-communities {
    gap: 2em;
    margin-bottom: 2em;
    flex-flow:row wrap;
    justify-content: flex-start;
  }
  #communities > *, #user-communities > * {
    cursor: pointer;
    min-width: 15em;
    max-width: 30em;
    flex: 1 1 10em;
    &:empty {
      height: 0;
      border: none;
    };
  }

  #buttons * {
    margin-right: 0;
  }
  #create-community.active {
    background: var(--color-bg-invert);
    color: var(--color-text-invert);
    transition: all .2s linear;
  }
  #sort {
    display: block;
    padding: .375em 1em;
    margin-left: .5em;
  }
  #sort > svg > path {
    fill: var(--color-text);
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
    color: var(--color-text);
  }
  #user-section {
    display: none;
  }
  #user-section.visible {
    display: block;
  }
  
  </style>
  <div id='main'>

    <space></space>

    <div style='position:absolute;right:0;padding:1rem 0;'>
      <div id='buttons' class='flex row' style='place-content:flex-end;'>
        <button id='create-community'>Create</button>
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

    <div id='creating-community'>
    </div>

    <div id='user-section'>
      <p class='xl light' style='padding:2rem 0;'><span><emoji-herb></emoji-herb><span> Your Communities</span></span></p>
      <div id='user-communities' class='flex row evenly'>
      </div>
    </div>
    <div>
      <p class='xl light' style='padding:2rem 0;'><span><emoji-camping></emoji-camping><span> Communities on Habitat</span></span></p>
      <div id='communities' class='flex row evenly'>
      </div>
    </div>
  </div>
  `;

  constructor() {
    super();

    this.tokens = []; //compare w each community token
    //if user has a community's token, toggle once
    this.userSection = this.shadowRoot.querySelector('#user-section');

    // sorting arrays
    this.communities = [];
    this.userCommunities = [];

    //append to containers & _loadeds
    this.container = this.shadowRoot.querySelector('#communities');
    this.userContainer = this.shadowRoot.querySelector('#user-communities');
    this._loaded = {};
    this._userLoaded = {};

    //for all flipcards, flip to front on window resize
    window.addEventListener('resize', () => {
      for (const flipcard of this.shadowRoot.querySelectorAll('habitat-flip-card')) {
        const wrapper = flipcard.shadowRoot.querySelector('.flip-wrapper')
        wrapper.classList.remove('flip');
      }
    });

    this.sorting;
    this.sortBtn = this.shadowRoot.querySelector('button#sort');
    this.dropdown = this.shadowRoot.querySelector('#sort-dropdown');
    this.selector = this.shadowRoot.querySelector('#sort-options');
    this.sortBtn.addEventListener('click', evt => {
        evt.stopPropagation();
        this.dropdown.classList.toggle('active');
        if (this.dropdown.classList.contains('active')) {
          this.selector.addEventListener('click', evt => {
            this.sort(evt.target.id);
          }, false);
          //click anywhere in communities tab to close
          this.shadowRoot.addEventListener('click', evt => {
            if (!evt.target.id.startsWith('sort-')) {
              this.dropdown.classList.remove('active');
            }
          }, false);
        }
    });
    
    checkScroll(
      this.shadowRoot.querySelector('#content'),
      async () => {
        for await (const community of this.communities) {
          if (!this._loaded[community.transactionHash]) {
            this._loaded[community.transactionHash] = true;
            this.renderCommunity(this.container, community);
          }
        }   
      }
    );

    this.container.insertAdjacentHTML('beforeend', '<span></span><div></div><div></div><div></div>')
  }

    //TODO: 
    //test community creation- does the fetchLatest function display community in user communities?

  get title () {
    return 'Communites';
  }

  async sort(sorting) {
    if (sorting.startsWith('sort-') && !sorting.match('sort-options')) {
      this.userContainer.innerHTML = ''
      this.userContainer.insertAdjacentHTML('beforeend', '<span></span><div></div><div></div><div></div>')
      this._userLoaded = {}
      this.container.innerHTML = ''
      this.container.insertAdjacentHTML('beforeend', '<span></span><div></div><div></div><div></div>')
      this._loaded = {}

      if (sorting === 'sort-az') {
        this.communities.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
        this.userCommunities.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
      }
      if (sorting === 'sort-za') {
        this.communities.sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase()) ? 1 : -1);
        this.userCommunities.sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase()) ? 1 : -1);
      }
      if (sorting === 'sort-recent') {
        this.communities.sort((a, b) => (a.block < b.block) ? 1 : -1);
        this.userCommunities.sort((a, b) => (a.block < b.block) ? 1 : -1);
      }
    }
    this.sorting = sorting;
  }

// ----------------------------------------------------
  //render elements
  async render () {

    this.chainUpdateCallback();
    
    const { habitat } = await getProviders();
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
        
        if (!this.communities[evt.transactionHash]) {
          this.communities.push(community);
        }
    }

    this.chainUpdateCallback();
  }
// ----------------------------------
  //updater
  async chainUpdateCallback () {

    const userLoad = () => {
      for (const community of this.userCommunities) {
        if (!this._userLoaded[community.transactionHash]) {
          this._userLoaded[community.transactionHash] = true;
          this.renderCommunity(this.userContainer, community);
        }
      }
    }
    async function _check () {
      userLoad();
      window.requestAnimationFrame(_check);
    }
    _check();

    let account;
    if (!walletIsConnected()) {

      //clear create button's former event listener
      this.shadowRoot.querySelector('#create-community').replaceWith(this.shadowRoot.querySelector('#create-community').cloneNode(true))

      //issue: this.chainUpdateCallback calling too late- button should be usable immediately on page load

      wrapListener(this.shadowRoot.querySelector('#create-community'), async () => {
        throw new Error('Please connect a wallet');
      });
    }
    if (walletIsConnected()) {
      //clear create button's former event listener
      this.shadowRoot.querySelector('#create-community').replaceWith(this.shadowRoot.querySelector('#create-community').cloneNode(true))

      account = await (await getSigner()).getAddress();

      wrapListener(
        this.shadowRoot.querySelector('#create-community'),
        (evt) => {
          let createCommunityCard = this.shadowRoot.querySelector('habitat-community-preview-creator');
          if (createCommunityCard) {
            throw new Error('Only one card allowed at a time');
          }
          else {
            this.shadowRoot.querySelector('button#create-community').classList.toggle('active');
            this.shadowRoot.querySelector('#creating-community').prepend(document.createElement('habitat-community-preview-creator'));
          }
        }
      );
    }

    // ????
    // if render() returns promise ...
    // or split function from here ...
    // issue: communities not fully loading before user communities
    // MORE RESEARCH ON ONCHAINUPDATE();
    // move (walletIsConnected) to HabitatPanel.js ???

    if (account) {

      const { HBT } = getConfig();
      let tokens = (await queryTransfers(account)).tokens;
  
      if (tokens.length === 0 || tokens !== this.tokens) {
  
        this.userCommunities = [];
        this.userSection.classList.remove('visible');
  
        for (const community of this.communities) {
          // following condition left out for demonstration purposes
          // && !community.token.includes(HBT)
          if (tokens.length > 0 && tokens.includes(community.token)) {
            if (!this.userSection.classList.contains('visible')) {
              this.userSection.classList.toggle('visible');
            }
            this.userCommunities.push(community);
          }
        }
  
        if (this.sorting) {
          this.sort(this.sorting);
        }
        else {
          this.userContainer.innerHTML = '';
          this.userContainer.insertAdjacentHTML('beforeend', '<span></span><div></div><div></div><div></div>')
          this._userLoaded = {};
        }
          
        this.tokens = tokens;
      }
    }

    await this.fetchLatest();
    
  }

  // ---------------------------------------------------
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

    const span = container.querySelector('span')

    if (prepend) {
      container.prepend(ele);
    } else {
      container.insertBefore(ele, span);
    }
  }

  async fetchLatest () {
    const { habitat } = await getProviders();
    const filter = habitat.filters.CommunityCreated();
    filter.toBlock = await habitat.provider.getBlockNumber();

    for await (const evt of pullEvents(habitat, filter, 1)) {
      if (!this._loaded[evt.transactionHash]) {
        this._loaded[evt.transactionHash] = true;
        this.renderCommunity(this.container, evt, true);
      }
    }
  }
  
}
customElements.define('habitat-communities', HabitatCommunities);