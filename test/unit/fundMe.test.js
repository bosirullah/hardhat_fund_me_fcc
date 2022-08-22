const {deployments, ethers, getNamedAccounts} = require("hardhat")
const {assert, expect} = require("chai")
const {developmentChains} = require("../../helper_hardhat_config")

developmentChains.includes(network.name)
    ? describe.skip
    :describe("FundMe", function(){
        let fundMe
        let deployer
        let mockV3Aggregator
        const sendValue = ethers.utils.parseEther("1") //1 ETH
        beforeEach(async function(){
            //deploy our fundMe contract
            //using hardhat-deploy
            // const accounts = await ethers.getSigners()
            // const accountZero = accounts[0]
            deployer = (await getNamedAccounts()).deployer
            await deployments.fixture(["all"])
            fundMe = await ethers.getContract("FundMe",deployer)
            mockV3Aggregator = await ethers.getContract(
                "MockV3Aggregator",
                deployer
            )
        })
        
        
        describe("constructor", function(){
            it("sets the aggregator address correctly", async function(){
                const response = await fundMe.getPriceFeed()
                assert.equal(response, mockV3Aggregator.address)
            })
        })

        describe("fund", function() {
            it("Fails if you don't send enough ETH", async () => {
                await expect(fundMe.fund()).to.be.revertedWith(
                    "You need to spend more ETH!"
                )
            })

            it("updated the amount funded data structure", async function(){
                await fundMe.fund({value: sendValue})
                const response = await fundMe.getAddressToAmountFunded(
                    deployer
                )
                assert.equal(response.toString(), sendValue.toString())
            })

            it("Add funder to array of getFunder", async function(){
                await fundMe.fund({value: sendValue})
                const funder = await fundMe.getFunder(0)
                assert.equal(funder,deployer)
            })

            
        })

        describe("cheaperWithdraw", function(){
            beforeEach(async function(){
                await fundMe.fund({value: sendValue})
            })

            it("cheaperWithdraw ETH from a single founder", async function(){
                //Arrange
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const startDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )
                //Act 
                const transactionResponse = await fundMe.cheaperWithdraw()
                const transactionReceipt = await transactionResponse.wait(1)
                const {gasUsed, effectiveGasPrice} = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)

                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )
                //Assert

                assert.equal(endingFundMeBalance,0)
                assert.equal(
                    startingFundMeBalance.add(startDeployerBalance),
                    endingDeployerBalance.add(gasCost).toString()
                )

            })

            it("allows us to cheaperWithdraw with multiple getFunder", async function(){
                const accounts = await ethers.getSigners()
                for(let i = 1;i<6;i++){
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    )
                    await fundMeConnectedContract.fund({ value: sendValue})
                }

                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const startDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )

                //Act
                const transactionResponse = await fundMe.cheaperWithdraw()
                const transactionReceipt = await transactionResponse.wait(1)
                const {gasUsed, effectiveGasPrice} = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)
                
                //Assert
                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                ) 

                //Assert
                assert.equal(endingFundMeBalance,0)
                assert.equal(
                    startingFundMeBalance.add(startDeployerBalance),
                    endingDeployerBalance.add(gasCost).toString()
                )

                //Make sure the getFunder array is reset properly
                await expect(fundMe.getFunder(0)).to.be.reverted

                for(i = 1;i<6;i++){
                    assert.equal(
                        await fundMe.getAddressToAmountFunded(
                            accounts[i].address
                        ),
                        0
                    )
                }
            })

            it("Only allows the owner to Withdraw", async function(){
                const accounts = await ethers.getSigners()
                const attacker = accounts[1]
                const attackerConnectedContract = await fundMe.connect(attacker)
                await expect(attackerConnectedContract.cheaperWithdraw()).to.be.reverted
            })

            it("Withdraw testing...", async function(){
                const accounts = await ethers.getSigners()
                for(let i = 1;i<6;i++){
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    )
                    await fundMeConnectedContract.fund({ value: sendValue})
                }

                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const startDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )

                //Act
                const transactionResponse = await fundMe.cheaperWithdraw()
                const transactionReceipt = await transactionResponse.wait(1)
                const {gasUsed, effectiveGasPrice} = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)
                
                //Assert
                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                ) 

                //Assert
                assert.equal(endingFundMeBalance,0)
                assert.equal(
                    startingFundMeBalance.add(startDeployerBalance),
                    endingDeployerBalance.add(gasCost).toString()
                )

                //Make sure the getFunder array is reset properly
                await expect(fundMe.getFunder(0)).to.be.reverted

                for(i = 1;i<6;i++){
                    assert.equal(
                        await fundMe.getAddressToAmountFunded(
                            accounts[i].address
                        ),
                        0
                    )
                }
            })
        })
    })