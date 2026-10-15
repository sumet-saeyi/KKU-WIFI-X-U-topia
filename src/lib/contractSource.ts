export const contractSource = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UIkigaiVault
 * @author U-Ikigai Team (U-Hackathon 2026 @ FLOW Summit Bangkok)
 * @notice Non-custodial AI session-key spending guardrails, 4-Pillar Ikigai
 *         autonomous wealth splitting, and generational RWA gift vaults on Avalanche C-Chain.
 */
contract UIkigaiVault {
    struct AgentGuardrail {
        address agentSigner;
        uint256 dailySpendCapUSD;
        uint256 spentTodayUSD;
        uint256 lastResetTimestamp;
        bool active;
    }

    struct IkigaiSplitRatio {
        uint8 professionPct; // e.g., 50% -> Daily Living & U-Card
        uint8 passionPct;    // e.g., 20% -> Family Legacy (U-GOLD / BLK-SLV)
        uint8 vocationPct;   // e.g., 15% -> U Academy & U-AI Mastery
        uint8 missionPct;    // e.g., 15% -> U.Center DAO & Community Impact
    }

    struct GenerationalGift {
        address benefactor;
        address beneficiary;
        string assetSymbol;  // "U-GOLD", "BLK-SLV", "AMZN", "USDT"
        uint256 amountUSD;
        uint256 createdAt;
        string familyBlessing;
    }

    mapping(address => AgentGuardrail) public userGuardrails;
    mapping(address => IkigaiSplitRatio) public userIkigaiSplits;
    mapping(address => GenerationalGift[]) public familyLegacyVaults;

    event GuardrailUpdated(address indexed user, address indexed agentSigner, uint256 dailySpendCapUSD);
    event IkigaiSplitUpdated(address indexed user, uint8 professionPct, uint8 passionPct, uint8 vocationPct, uint8 missionPct);
    event AgentPaymentExecuted(address indexed user, string merchantName, uint256 amountUSD, string intentHash);
    event IncomeAutoSplitExecuted(address indexed user, uint256 totalAmountUSD, uint256 professionAmt, uint256 passionAmt, uint256 vocationAmt, uint256 missionAmt);
    event GenerationalGiftLocked(address indexed benefactor, address indexed beneficiary, string assetSymbol, uint256 amountUSD, string familyBlessing);

    function configureAgentGuardrail(address _agentSigner, uint256 _dailySpendCapUSD) external {
        userGuardrails[msg.sender] = AgentGuardrail({
            agentSigner: _agentSigner,
            dailySpendCapUSD: _dailySpendCapUSD,
            spentTodayUSD: 0,
            lastResetTimestamp: block.timestamp,
            active: true
        });
        emit GuardrailUpdated(msg.sender, _agentSigner, _dailySpendCapUSD);
    }

    function configureIkigaiSplit(
        uint8 _professionPct,
        uint8 _passionPct,
        uint8 _vocationPct,
        uint8 _missionPct
    ) external {
        require(
            _professionPct + _passionPct + _vocationPct + _missionPct == 100,
            "Ikigai split must equal 100%"
        );
        userIkigaiSplits[msg.sender] = IkigaiSplitRatio({
            professionPct: _professionPct,
            passionPct: _passionPct,
            vocationPct: _vocationPct,
            missionPct: _missionPct
        });
        emit IkigaiSplitUpdated(msg.sender, _professionPct, _passionPct, _vocationPct, _missionPct);
    }

    function verifyAndRecordAgentSpend(
        address _user,
        string calldata _merchantName,
        uint256 _amountUSD,
        string calldata _intentHash
    ) external returns (bool) {
        AgentGuardrail storage g = userGuardrails[_user];
        require(g.active, "Agent guardrail not active");
        require(msg.sender == g.agentSigner || msg.sender == _user, "Unauthorized agent signer");

        if (block.timestamp >= g.lastResetTimestamp + 1 days) {
            g.spentTodayUSD = 0;
            g.lastResetTimestamp = block.timestamp;
        }
        require(g.spentTodayUSD + _amountUSD <= g.dailySpendCapUSD, "Exceeds non-custodial daily AI cap");

        g.spentTodayUSD += _amountUSD;
        emit AgentPaymentExecuted(_user, _merchantName, _amountUSD, _intentHash);
        return true;
    }

    function recordIkigaiIncomeSplit(uint256 _incomingAmountUSD) external {
        IkigaiSplitRatio memory s = userIkigaiSplits[msg.sender];
        uint8 prof = s.professionPct == 0 ? 50 : s.professionPct;
        uint8 pass = s.passionPct == 0 ? 20 : s.passionPct;
        uint8 voc  = s.vocationPct == 0 ? 15 : s.vocationPct;
        uint8 miss = s.missionPct == 0 ? 15 : s.missionPct;

        emit IncomeAutoSplitExecuted(
            msg.sender,
            _incomingAmountUSD,
            (_incomingAmountUSD * prof) / 100,
            (_incomingAmountUSD * pass) / 100,
            (_incomingAmountUSD * voc) / 100,
            (_incomingAmountUSD * miss) / 100
        );
    }

    function lockGenerationalGift(
        address _beneficiary,
        string calldata _assetSymbol,
        uint256 _amountUSD,
        string calldata _familyBlessing
    ) external {
        familyLegacyVaults[_beneficiary].push(GenerationalGift({
            benefactor: msg.sender,
            beneficiary: _beneficiary,
            assetSymbol: _assetSymbol,
            amountUSD: _amountUSD,
            createdAt: block.timestamp,
            familyBlessing: _familyBlessing
        }));
        emit GenerationalGiftLocked(msg.sender, _beneficiary, _assetSymbol, _amountUSD, _familyBlessing);
    }
}`;
