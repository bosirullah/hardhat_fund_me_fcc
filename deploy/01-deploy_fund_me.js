//import

/* 
    async function deployFunc(){
        console.log("HI!")
        hre.getNamedAccounts()
        hre.deployments

    }

    module.exports.default = deployFunc
*/

//   or

/*
module.exports = async (hre) => {
    const {getNamedAccounts, deployments} = here
    //      or
    //hre.getNamedAccounts
    // hre.deployments
}*/

//orr
const {networkConfig,developmentChains} = require("../helper_hardhat_config")
const {getNamedAccounts,deployments,network} = require("hardhat")
const {verify} = require("../utils/verify")
//       or
/*
    const helperConfig = require("../helper_hardhat_config")
    const networkConfig = helperConfig.networkConfig
*/

module.exports = async({getNamedAccounts,deployments}) => {
    const {deploy,log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId
    //jf chainId is X use Address You
    //if chainId is Z use address A

    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    if(developmentChains.includes(network.name)){
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    }
    else{
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    
    //if the contract dosen't exist, we deploy a minimal version of 
    //for our local testing


    //well what happens when we want to chains?
    //when going for localhost or hardhat network we want to use a mock

    log("------------------------------------------------------------")
    log("Deploying FundMe and waiting for confirmations....")
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe",{
        from: deployer,
        args: args, // put price feed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })

    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        //verify
        await verify(fundMe.address,args)
    }

    log("---------------------------------------------")

}

module.exports.tags = ["all", "fundMe"]