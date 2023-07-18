// an astronaut riding a horse on mars, hd,  dramatic lighting 

import { useState, useEffect } from 'react';
import { NFTStorage, File } from 'nft.storage'
import { Buffer } from 'buffer';
import { ethers } from 'ethers';
import axios from 'axios';

// Components
import Spinner from 'react-bootstrap/Spinner';
import Navigation from './components/Navigation';

// ABIs
import NFT from './abis/NFT.json'

// Config
import config from './config.json';

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [nft, setNFT] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [url, setURL] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [message, setMessage] = useState("");

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider);

    const network = await provider.getNetwork();

    const nft = new ethers.Contract(config[network.chainId].nft.address, NFT, provider)
    setNFT(nft);

    const name = await nft.name();
      console.log ("name", name);
  }
  

  const submitHandler = async (e)=>{
    e.preventDefault();

    if(name === "" || description === ""){
      window.alert("Please provide a name and a description")
      return
    }
    setIsWaiting(true);

    const imageData = await createImage();
    console.log("generated!!!")
    
    const url = await uploadImage();
    setIsWaiting(false);
    setMessage("");

    // console.log("url", url);
    await mintImage(url);
    console.log("Success!")
  }

  const createImage = async ()=>{
    console.log("Genrating Image");
    setMessage("Genrating Image");


    const URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2"

    const response = await axios({
      url: URL,
      method: 'POST',
      headers: {
        Authorization: `Bearer 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`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        inputs:description, options: {wait_for_model: true},
      }),
      responseType: 'arraybuffer',
    });

    const type = response.headers['content-type'];
    const data = response.data;
    console.log("data",data)

    const base64data = Buffer.from(data).toString('base64')
    const img = `data:${type};base64,` + base64data ;
    setImage(img);
    return data
  }

  const uploadImage = async( imageData)=>{
    console.log("Uploading Image...");
    setMessage("Uploading Image...");


    const nftstorage = new NFTStorage({token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGFlNDQ3NDYzNzhiODVEOTcwM0QzNDRmNEI5YjA5M2I5QzE5NTcxNWEiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY4OTY4Njk1MDcwMCwibmFtZSI6IkFpIE5GVCJ9.x_x8vKo8MU56glQxUL_jdo2qBfhO-JdEeOVPXPlpxAk" })

    const {ipnft} = await nftstorage.store({
      image: new File([imageData], "image.jpeg", {type: "image/jpeg"}),
      name: name,
      description: description,
    })

    const url = `https://ipfs.io/ipfs/${ipnft}/metadata.json`
    setURL(url);
    return url
  }

  const mintImage = async (tokenURI) =>{
    console.log("Waiting for Mint...");
    setMessage("Waiting for Mint...");

    const signer = await provider.getSigner();
    const transaction = await nft.connect(signer).mint(tokenURI, {value: ethers.utils.parseEther("1", "ether")});
    await transaction.wait(); 


  }

  useEffect(() => {
    loadBlockchainData()
  }, [])

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />

      <div className='form'>
        <form onSubmit={submitHandler}>
          <input type='text' placeholder='Create a name...' onChange={(e)=>{setName(e.target.value)}}></input>
          <input type='text' placeholder='Create a description' onChange={(e)=>{setDescription(e.target.value)}}></input>
          <input type='submit'value="Create & Mint"></input>
        </form>
        <div className='image'>

          {!isWaiting && image ? (
            <img src={image} alt='AI generated Image'></img>

          ): isWaiting ? (

          <div className='image__placeholder'>
            <Spinner animation='border' />
            <p>{message}</p>
          </div>
          ): (<></>)}
        </div>
      </div>

      {!isWaiting && url && (
        <p>View&nbsp;<a href={url} target='_blank' rel='noreferrer'>Metadata</a></p>
      )}
    </div>
  );
}

export default App;
