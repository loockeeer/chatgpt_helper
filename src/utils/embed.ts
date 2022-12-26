import {Colors, EmbedBuilder, Guild, User} from "discord.js";


export enum EmbedUtilType {
  ERROR = Colors.Red,
  INFO = Colors.Blue,
  SUCCESS = Colors.Green,
  BLANK = Colors.DarkButNotBlack
}

export class EmbedUtil extends EmbedBuilder {
  private type: EmbedUtilType

  constructor(type: EmbedUtilType) {
    super()
    this.type = type
    this.setColor(type)
  }

  setContent(content: string): EmbedUtil {
    this.setDescription(content)
    return this
  }

  setTarget(target: Guild | User): EmbedUtil {
    if (target instanceof Guild) {
      this.setAuthor({
        name: target.name,
        iconURL: target.iconURL({
          extension: "png"
        }) || undefined
      })
    } else if (target instanceof User) {
      this.setAuthor({
        name: target.tag,
        iconURL: target.avatarURL({
          extension: "png"
        }) || undefined
      })
    }
    return this
  }
}