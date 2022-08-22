const {deployments, ethers, getNamedAccounts} = require("hardhat")
const {assert, expect} = require("chai")
const {developmentChains} = require("../../helper_hardhat_config")

//let variable = false
// let someVar = variable ? "yes": "no"

// if(variable) (someVar = "yes") else (someVar: "no")

developmentChains.includes(network.name)
    ? describe.skip
    :describe("FundMe", function(){
        let fundMe
        let deployer
        const sendValue = ethers.utils.parseEther("1") //1 ETH
        beforeEach(async function(){
            deployer = (await getNamedAccounts()).deployer
            fundMe = await ethers.getContract("FundMe",deployer)
        })

        it("allows people to fund and withdraw",async function(){
            await fundMe.fund({value: sendValue})
            await fundMe.withdraw()
            const endingBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            assert.equal(endingBalance.toString(), "0")
        })
    })